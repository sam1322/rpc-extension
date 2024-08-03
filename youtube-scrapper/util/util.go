package util

import (
	"fmt"
	"net/url"
	"regexp"
)

// func testing() {

// 	youtubeURL := "https://www.youtube.com/watch?v=Xke6p-LJSlY&pp=ygVaRGFubnkgRWxmbWFuIC0gTWFpbiBUaXRsZSB8IFNwaWRlci1NYW4gKE9yaWdpbmFsIE1vdGlvbiBQaWN0dXJlIFNjb3JlKSBzb255c291bmR0cmFja3N2ZXZv"
// 	videoID, err := ExtractVideoID(youtubeURL)
// 	if err != nil {
// 		fmt.Println("Error:", err)
// 	} else {
// 		fmt.Println("Video ID:", videoID)
// 	}

// 	youtubeChannelURL := "https://www.youtube.com/@SonySoundtracksVEVO"
// 	channelID, err := ExtractChannelID(youtubeChannelURL)
// 	if err != nil {
// 		fmt.Println("Error:", err)
// 	} else {
// 		fmt.Println("Channel ID:", channelID)
// 	}

// }

func ExtractVideoID(youtubeURL string) (string, error) {
	u, err := url.Parse(youtubeURL)
	if err != nil {
		return "", err
	}

	query := u.Query()

	// Check for the video ID in the query parameters (e.g., watch?v=VIDEO_ID)
	if v, ok := query["v"]; ok && len(v) > 0 {
		return v[0], nil
	}

	// Define regular expressions for different types of YouTube URLs
	var re *regexp.Regexp

	// Pattern for shorts and music URLs
	if u.Host == "www.youtube.com" {
		// Check if the path is for shorts or music
		if match, _ := regexp.MatchString(`^/shorts/`, u.Path); match {
			re = regexp.MustCompile(`^/shorts/([^/?]+)`)
		} else if match, _ := regexp.MatchString(`^/watch/`, u.Path); match {
			re = regexp.MustCompile(`^/watch/([^/?]+)`)
		}
	}

	// For other cases, return an error if no video ID is found
	if re != nil {
		matches := re.FindStringSubmatch(u.Path)
		if len(matches) > 1 {
			return matches[1], nil
		}
	}

	return "", fmt.Errorf("no video ID found")
}

// ExtractChannelID extracts the channel ID from a YouTube channel URL.
func ExtractChannelID(youtubeURL string) (string, error) {
	u, err := url.Parse(youtubeURL)
	if err != nil {
		return "", err
	}

	// Define a regular expression for YouTube channel URLs using @username
	re := regexp.MustCompile(`^/@([^/?]+)`)

	matches := re.FindStringSubmatch(u.Path)
	if len(matches) > 1 {
		return matches[1], nil
	}

	return "", fmt.Errorf("no channel ID found")
}
