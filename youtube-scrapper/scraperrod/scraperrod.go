package scraperrod

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"
	"youtube-scrapper/database"
	"youtube-scrapper/util"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

type ScrapperRod struct {
	db *database.Database
}

type VideoRequest struct {
	Title       string `json:"title"`
	ChannelName string `json:"channelName"`
}

// type Video struct {
// 	Title       string `json:"title"`
// 	ChannelName string `json:"channelName"`
// 	VideoUrl    string `json:"videoUrl"`
// 	ChannelUrl  string `json:"channelUrl"`
// 	Description string `json:"description"`
// 	VideoId     string `json:"videoId"`
// 	// PublishedAt string `json:"publishedAt"`
// 	// ViewCount   string `json:"viewCount"`
// }

type Video = database.Video

var (
	browser *rod.Browser
	mu      sync.Mutex
)

// NewScrapper initializes a new Scrapper instance with a database connection.
func NewScrapper(db *database.Database) *ScrapperRod {
	return &ScrapperRod{db: db}
}

// ScrapeAndStoreVideo checks if a video exists in the database, scrapes if not, and stores it.
func (s *ScrapperRod) ScrapeAndStoreVideo(title, channelName string) (*Video, error) {
	// Check if the video already exists in the database
	video, err := s.db.GetVideoByTitleAndChannel(title, channelName)
	if err != nil {
		// Video found in the database
		// fmt.Printf("Video already exists: %+v\n", video)
		// return nil, fmt.Errorf("something went wrong %+v\n ", err)
		log.Println(err.Error())
	}

	// if video == nil {
	// 	log.Printf("Video does not exists in DB")
	// 	video, err = GetSingleVideo(title, channelName)
	// 	if err != nil {
	// 		return nil, fmt.Errorf("failed to scrape video: %v", err)
	// 	}

	// 	// Store the video in the database
	// 	existingVideo, _ := s.db.GetVideoById(video.VideoId)
	// 	if existingVideo == nil {
	// 		err = s.db.AddVideo(video)
	// 		if err != nil {
	// 			return nil, fmt.Errorf("failed to store video: %v", err)
	// 		}
	// 		log.Printf("Video stored in DB : " + video.VideoId)
	// 	} else {
	// 		video = existingVideo
	// 		log.Printf("Existing Video stored in DB : " + video.VideoId)

	// 	}

	// }

	return video, nil
}

// YoutubeScrapper handles the HTTP request for scraping and storing a video.
func YoutubeScrapper(s *ScrapperRod) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var request VideoRequest
		err := json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			// Handle error
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Access user attributes
		title := request.Title
		channelName := request.ChannelName

		log.Printf("Scraping video: %s by %s", title, channelName)

		video, err := s.ScrapeAndStoreVideo(title, channelName)

		// video, err := GetSingleVideo(title, channelName)
		// videos, err := scraperrod.GetVideoInfo(title, channelName)
		// videos, err := scrapper.GetVideoInfo(title, channelName)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		// Set content type to JSON
		w.Header().Set("Content-Type", "application/json")

		// Encode the user struct as JSON
		// err = json.NewEncoder(w).Encode(struct {
		// 	Message string `json:"message"`
		// }{Message: "Data successfully received"})
		err = json.NewEncoder(w).Encode(video)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func init() {
	u := launcher.NewUserMode().Headless(false).MustLaunch()

	browser = rod.New().ControlURL(u).MustConnect()

}
func CloseBrowserContext() {
	if browser != nil {
		log.Println("Closing browser context")
		browser.MustClose()
	}
}

func GetVideoInfo(title, channelName string) ([]Video, error) {
	fmt.Println("Getting video info", title, channelName)
	// Protect concurrent access to browser context

	// Lock to prevent concurrent access to the browser context
	mu.Lock()
	defer mu.Unlock()

	fmt.Println("Scraping Youtube Search Page")
	startTime := time.Now()

	searchQuery := title + " " + channelName

	youtubeUrl := `https://www.youtube.com/results?search_query=` + strings.ReplaceAll(searchQuery, " ", "+")
	fmt.Println(youtubeUrl)

	page := browser.MustPage(youtubeUrl)
	defer page.Close()

	// Wait for the video elements to be visible
	page.MustWaitLoad().MustWaitElementsMoreThan("ytd-video-renderer", 0)
	var videos []Video
	result := page.MustEval(`() => {
		const videoElements = document.querySelectorAll('ytd-video-renderer');
		return Array.from(videoElements).slice(0, 10).map(video => {
			const channelNameElement = video.querySelector('#channel-name');
			const anchorElement = channelNameElement ? channelNameElement.querySelector('a') : null;
			const descriptionElement = video.querySelector('.metadata-snippet-text');
			return {
				title: video.querySelector('#video-title') ? video.querySelector('#video-title').textContent.trim() : '',
				videoUrl: video.querySelector('#video-title') ? video.querySelector('#video-title').href : '',
				channelName: anchorElement ? anchorElement.textContent.trim() : '',
				channelUrl: anchorElement ? anchorElement.href : '',
				description: descriptionElement ? descriptionElement.textContent.trim() : ''
			};
		});
	}`)

	// Convert the result to a slice of maps
	// var objects []map[string]interface{}
	err := result.Unmarshal(&videos)
	if err != nil {
		return nil, fmt.Errorf("failed to scrape %s: %v", youtubeUrl, err)
	}

	// Wait for the element and get its text
	// text, err := page.Timeout(10 * time.Second).Element(`#channel-name a`).Text()
	// if err != nil {
	// 	return nil, fmt.Errorf("Failed to scrape %s: %v", youtubeUrl, err)
	// }

	// fmt.Fprintf(w, "Data from %s: %s\n", youtubeUrl, text)
	loadTime := time.Since(startTime)
	log.Println("Time taken to load browser:", loadTime)
	return videos, nil
}

func GetSingleVideo(title, channelName string) (*Video, error) {
	videos, err := GetVideoInfo(title, channelName)

	if err != nil {
		return &Video{}, fmt.Errorf("failed to scrape any video")
	}

	if len(videos) == 0 {
		return &Video{}, fmt.Errorf("failed to scrape any video")
	}
	videoItem := findVideoItem(title, channelName, videos)

	videoID, err := util.ExtractVideoID(videoItem.VideoUrl)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Video ID:", videoID)
		videoItem.VideoId = videoID
	}
	return videoItem, nil
}

func normalizeString(str string) string {
	re := regexp.MustCompile(`[^\w\s]`)
	return re.ReplaceAllString(strings.ToLower(strings.TrimSpace(str)), "")
}

func findVideoItem(title, channelName string, arr []Video) *Video {
	lowerTitle := strings.ToLower(title)
	lowerChannelName := strings.ToLower(channelName)

	var videoItem *Video

	for _, item := range arr {
		if strings.Contains(strings.ToLower(item.Title), lowerTitle) &&
			strings.ToLower(item.ChannelName) == lowerChannelName {
			videoItem = &item
			break
		}
	}

	if videoItem == nil {
		for _, item := range arr {
			normalizedItemTitle := normalizeString(item.Title)
			normalizedItemChannel := normalizeString(item.ChannelName)
			normalizedSearchTitle := normalizeString(title)
			normalizedSearchChannel := normalizeString(channelName)

			if strings.Contains(normalizedItemTitle, normalizedSearchTitle) &&
				(normalizedItemChannel == normalizedSearchChannel ||
					strings.Contains(normalizedItemChannel, normalizedSearchChannel) ||
					strings.Contains(normalizedSearchChannel, normalizedItemChannel)) {
				videoItem = &item
				break
			}
		}
	}

	return videoItem
}
