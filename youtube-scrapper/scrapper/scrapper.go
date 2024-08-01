package scrapper

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/chromedp/chromedp"
)

type Video struct {
	Title       string `json:"title"`
	ChannelName string `json:"channelName"`
	VideoUrl    string `json:"videoUrl"`
	ChannelUrl  string `json:"channelUrl"`
	Description string `json:"description"`
	// PublishedAt string `json:"publishedAt"`
	// ViewCount   string `json:"viewCount"`
}

// Define a global context and cancel function
var globalCtx context.Context
var cancelFunc context.CancelFunc
var mu sync.Mutex

func init() {
	if globalCtx == nil {
		log.Println("global Context is nill")
		initializeBrowserContext()
		// defer closeBrowserContext() // Close the browser context when the function exits
	}
}

func GetVideoInfo(title, channelName string) ([]Video, error) {
	fmt.Println("Getting video info", title, channelName)
	// Protect concurrent access to browser context
	mu.Lock()
	defer mu.Unlock()

	// if globalCtx == nil {
	// 	log.Println("global Context is nill")
	// 	initializeBrowserContext()
	// 	defer closeBrowserContext() // Close the browser context when the function exits
	// }

	// ctx, cancel := context.WithTimeout(globalCtx, 20*time.Second)
	// defer cancel()

	fmt.Println("Scraping Youtube Search Page")
	startTime := time.Now()

	searchQuery := title + " " + channelName

	youtubeUrl := `https://www.youtube.com/results?search_query=` + strings.ReplaceAll(searchQuery, " ", "+")
	fmt.Println(youtubeUrl)

	var videos []Video
	selector := "#contents"
	// err := chromedp.Run(ctx,
	err := chromedp.Run(globalCtx,
		chromedp.Navigate(youtubeUrl),
		// chromedp.Sleep(5*time.Second), // Wait for some time for the page to load
		chromedp.WaitVisible(selector), // Wait for <video> element to become visible
		// chromedp.InnerHTML("html", &htmlContent),
		chromedp.Evaluate(`
		(() => {
			const videos = document.querySelectorAll('ytd-video-renderer');
			return Array?.from(videos)?.slice(0, 10)?.map(video => {
			const channelNameElement = video.querySelector('#channel-name');
			const anchorElement = channelNameElement.querySelector('a');
			const descriptionElement = video.querySelector('.metadata-snippet-text');
				return {
					title: video.querySelector('#video-title')?.textContent?.trim(),
					videoUrl: video.querySelector('#video-title')?.href,
					channelName:anchorElement.textContent?.trim(),
					channelUrl: anchorElement?.href,
					description: descriptionElement?.textContent?.trim()
				};
			});
		})()
	`, &videos),
	)

	// var html string
	// err := chromedp.Run(globalCtx,
	// 	chromedp.Navigate(youtubeUrl),
	// 	chromedp.OuterHTML("ytd-item-section-renderer", &html, chromedp.ByQuery),
	// )
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// doc.Find("ytd-video-renderer").Each(func(i int, s *goquery.Selection) {
	// 	if i >= 10 {
	// 		return
	// 	}
	// 	video := Video{
	// 		Title:       s.Find("#video-title").Text(),
	// 		VideoUrl:    s.Find("#video-title").AttrOr("href", ""),
	// 		ChannelName: s.Find("#channel-name a").Text(),
	// 		ChannelUrl:  s.Find("#channel-name a").AttrOr("href", ""),
	// 		Description: s.Find(".metadata-snippet-text").Text(),
	// 	}
	// 	videos = append(videos, video)
	// })

	if len(videos) == 0 {
		fmt.Println("No videos found.")
	} else {
		fmt.Printf("Found %d videos:\n", len(videos))
		for i, video := range videos {
			fmt.Printf("%d. Title: %s\n   Channel: %s\n   videoUrl: %s\n  channelUrl: %s\n   Description: %s\n\n",
				i+1, video.Title, video.ChannelName, video.VideoUrl, video.ChannelUrl, video.Description)
		}
	}

	if err != nil {
		return nil, fmt.Errorf("Failed to scrape %s: %v", youtubeUrl, err)
		// http.Error(w, fmt.Sprintf("Failed to scrape %s: %v", url, err), http.StatusInternalServerError)
	}
	loadTime := time.Since(startTime)
	log.Println("Time taken to load browser:", loadTime)
	return videos, nil
}

// Initialize the browser context
func initializeBrowserContext() {
	log.Println("Initializing browser context")

	startTime := time.Now()

	globalCtx, cancelFunc = chromedp.NewContext(context.Background())

	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true), // Set to false for a visible (non-headless) browser
		// chromedp.NoDefaultBrowserCheck,
		// chromedp.NoFirstRun,
		chromedp.Flag("enable-automation", false),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.Flag("disable-default-apps", false),
		chromedp.Flag("disable-extensions", false),
		// chromedp.Flag("disable-web-security", true),
		chromedp.Flag("ignore-certificate-errors", true),
		chromedp.Flag("allow-running-insecure-content", true),
		// chromedp.Flag("disable-gpu", true),
		// chromedp.Flag("blink-settings", "imagesEnabled=true"),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36"),
		chromedp.WindowSize(1900, 1200),
	)

	// Create a new browser context
	allocCtx, _ := chromedp.NewExecAllocator(globalCtx, opts...)
	// Create a new context with the browser context
	globalCtx, cancelFunc = chromedp.NewContext(allocCtx)
	// defer cancel()

	loadTime := time.Since(startTime)
	log.Println("Time taken to load browser:", loadTime)
}

// Close the browser context when it's no longer needed
func CloseBrowserContext() {
	cancelFunc()
	globalCtx = nil
}
