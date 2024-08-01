package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"
)

type Database struct {
	// db *pgx.Conn
	db *sql.DB
}

type Video struct {
	Title       string `json:"title"`
	ChannelName string `json:"channelName"`
	VideoUrl    string `json:"videoUrl"`
	ChannelUrl  string `json:"channelUrl"`
	Description string `json:"description"`
	VideoId     string `json:"videoId"`
}

var (
	database = os.Getenv("DB_DATABASE")
	password = os.Getenv("DB_PASSWORD")
	username = os.Getenv("DB_USERNAME")
	port     = os.Getenv("DB_PORT")
	host     = os.Getenv("DB_HOST")
)

func New() *Database {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", username, password, host, port, database)
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		log.Fatal(err)
	}

	// Ping the database to ensure a connection is established
	if err := db.PingContext(context.Background()); err != nil {
		log.Fatal("Unable to connect to database:", err)
	}

	fmt.Println("Connected to database")
	return &Database{db: db}
}

// Close closes the database connection.
func (db *Database) Close() error {
	return db.db.Close()
}

func (s *Database) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := s.db.PingContext(ctx)
	if err != nil {
		log.Fatalf(fmt.Sprintf("db down: %v", err))
	}

	return map[string]string{
		"message": "It's healthy",
	}
}

func prepareSearchQuery(title string) string {
	// Split the title into words
	words := strings.Fields(title)

	// Join the words with ' & ' for AND logic in full-text search
	searchQuery := strings.Join(words, " & ")

	// Wrap each word in :* for prefix matching
	searchQuery = strings.ReplaceAll(searchQuery, " & ", ":* & ") + ":*"

	return searchQuery
}

// // GetVideoByTitleAndChannel checks if a video exists by title and channel name using ILIKE.
func (db *Database) GetVideoByTitleAndChannel(title, channelName string) (*Video, error) {

	queries := []string{
		`SELECT video_id, title, channel_name, video_url, channel_url, description FROM videos WHERE similarity(title, $1) > 0.3 AND channel_name ILIKE $2 ORDER BY similarity(title, $1) DESC LIMIT 1`,
		`SELECT video_id, title, channel_name, video_url, channel_url, description FROM videos WHERE levenshtein(lower(title), lower($1)) <= 3 AND channel_name ILIKE $2 ORDER BY levenshtein(lower(title), lower($1)) LIMIT 1`,
		`SELECT video_id, title, channel_name, video_url, channel_url, description FROM videos WHERE to_tsvector('english', title) @@ to_tsquery('english', $1) OR similarity(title, $1) > 0.3 AND channel_name ILIKE $2 ORDER BY ts_rank(to_tsvector('english', title), to_tsquery('english', $1)) DESC, similarity(title, $1) DESC LIMIT 1`,
	}

	for _, query := range queries {
		var video Video
		err := db.db.QueryRowContext(context.Background(), query, prepareSearchQuery(title), "%"+channelName+"%").Scan(
			&video.VideoId, &video.Title, &video.ChannelName, &video.VideoUrl, &video.ChannelUrl, &video.Description)
		if err == nil {
			return &video, nil
		}
		if err != sql.ErrNoRows {
			return nil, err
		}
	}

	return nil, sql.ErrNoRows

	// row := db.db.QueryRowContext(context.Background(), `
	// SELECT video_id, title, channel_name, video_url, channel_url, description, created_at
	// FROM videos
	// WHERE levenshtein(lower(title), lower($1)) <= 3 AND channel_name ILIKE $2
	// ORDER BY levenshtein(lower(title), lower($1))
	// LIMIT 1`,
	// 	title, "%"+channelName+"%")

	// row := db.db.QueryRowContext(context.Background(), `
	// SELECT video_id, title, channel_name, video_url, channel_url, description, created_at
	// FROM videos
	// WHERE similarity(title, $1) > 0.3 AND channel_name ILIKE $2
	// ORDER BY similarity(title, $1) DESC
	// LIMIT 1`,
	// 	title, "%"+channelName+"%")

	// row := db.db.QueryRowContext(context.Background(), `
	// SELECT video_id, title, channel_name, video_url, channel_url, description, created_at
	// FROM videos
	// WHERE to_tsvector('english', title) @@ to_tsquery('english', $1)
	//   OR similarity(title, $1) > 0.3
	// AND channel_name ILIKE $2
	// ORDER BY ts_rank(to_tsvector('english', title), to_tsquery('english', $1)) DESC,
	//          similarity(title, $1) DESC
	// LIMIT 1`,
	// 	strings.ReplaceAll(title, " ", " & "), "%"+channelName+"%")

	// row := db.db.QueryRowContext(context.Background(), `
	// 	SELECT video_id, title, channel_name, video_url, channel_url, description
	// 	FROM videos
	// 	WHERE title ILIKE $1 AND channel_name ILIKE $2`, title, channelName)

	// row := db.db.QueryRowContext(context.Background(), `
	// 	SELECT video_id, title, channel_name, video_url, channel_url, description, createdAt
	// 	FROM videos
	// 	WHERE title ILIKE '%' || $1 || '%' AND channelName ILIKE $2`, title, channelName)

	// var video Video
	// err := row.Scan(&video.VideoId, &video.Title, &video.ChannelName, &video.VideoUrl, &video.ChannelUrl, &video.Description)
	// if err != nil {
	// 	if err == sql.ErrNoRows {
	// 		return nil, fmt.Errorf("video not found")
	// 	}
	// 	return nil, err
	// }

	// return &video, nil
}

func (db *Database) GetVideoById(videoId string) (*Video, error) {
	row := db.db.QueryRowContext(context.Background(), `
		SELECT video_id, title, channel_name, video_url, channel_url, description
		FROM videos
		WHERE video_id = $1`, videoId)
	// row := db.db.QueryRowContext(context.Background(), `
	// 	SELECT video_id, title, channel_name, video_url, channel_url, description, createdAt
	// 	FROM videos
	// 	WHERE title ILIKE '%' || $1 || '%' AND channelName ILIKE $2`, title, channelName)

	var video Video
	err := row.Scan(&video.VideoId, &video.Title, &video.ChannelName, &video.VideoUrl, &video.ChannelUrl, &video.Description)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("video not found")
		}
		return nil, err
	}

	return &video, nil
}

// // AddVideo adds a new video to the database.
func (db *Database) AddVideo(video *Video) error {
	_, err := db.db.ExecContext(context.Background(), "INSERT INTO videos (video_id, title, channel_name, video_url, channel_url, description) VALUES ($1, $2, $3, $4, $5, $6)",
		video.VideoId, video.Title, video.ChannelName, video.VideoUrl, video.ChannelUrl, video.Description)
	return err
}
