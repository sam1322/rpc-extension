package main

import (
	"fmt"
	"net/http"
	"time"
	"youtube-scrapper/database"
	"youtube-scrapper/scraperrod"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {

	// defer scraperrod.CloseBrowserContext()
	// defer scrapper.CloseBrowserContext()

	db := database.New()
	defer db.Close()

	// Initialize the scrapper with the database connection

	r := chi.NewRouter()
	// A good base middleware stack
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://*", "http://*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	s := scraperrod.NewScrapper(db)
	//defer s.CloseBrowserContext()

	r.Get("/", Welcomefunc)

	r.Post("/youtube", scraperrod.YoutubeScrapper(s))

	fmt.Println("Server is running on port 8080")

	http.ListenAndServe(":8080", r)
}

func Welcomefunc(w http.ResponseWriter, r *http.Request) {

	fmt.Fprintf(
		w, `
		  ##         .
	## ## ##        ==
 ## ## ## ## ##    ===
/"""""""""""""""""\___/ ===
{                       /  ===-
\______ O           __/
 \    \         __/
  \____\_______/

	
Hello from Docker!

`)
}
