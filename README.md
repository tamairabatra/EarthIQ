# EarthIQ

### Click below to watch the product demo and a full explanation of key features

[![Watch the demo video](https://img.youtube.com/vi/Y1ZXg7mac0A/0.jpg)](https://youtu.be/Y1ZXg7mac0A)

EarthIQ is an intelligent, AI-powered mobile web application designed to help users identify waste, track their environmental impact, and find local recycling and donation centers. 

EarthIQ turns daily habits into a gamified sustainability journey, making it easier for everyone to contribute to a greener planet.

## Key Features

*   **AI Waste Scanner**: Snap a photo to classify waste items instantly using advanced AI. Get immediate sorting advice and material information.
*   **Impact Tracker**: Monitor your environmental footprint through a personal dashboard that tracks your recycling habits and impact.
*   **Eco-Resources Map**: Locate nearby donation centers, recycling hubs, food pantries, and repair shops based on your current location.
*   **EcoLand Gamification**: Engage with a gamified learning experience where you can complete levels, take trivia challenges, and earn points for your sustainability knowledge.
*   **Installable PWA**: EarthIQ is a Progressive Web App, meaning you can install it directly on your smartphone's home screen for quick access.

## Project Gallery

| 1 | 2 | 3 |
| :--- | :--- | :--- |
| ![1](/gallery/1.png) | ![2](/gallery/2.png) | ![3](/gallery/3.png) |
| ![4](/gallery/4.png) | ![5](/gallery/5.png) | ![6](/gallery/6.png) |
| ![7](/gallery/7.png) | ![8](/gallery/8.png) | ![9](/gallery/9.png) |
| ![10](/gallery/10.png) | ![11](/gallery/11.png) | ![12](/gallery/12.png) |
| ![13](/gallery/13.png) | ![14](/gallery/14.png) | ![15](/gallery/15.png) |
| ![16](/gallery/16.png) | ![17](/gallery/17.png) | ![18](/gallery/18.png) |

## How to Use

### Scanning Waste
1.  Open EarthIQ on your device.
2.  Tap the camera scanner icon to take a photo of the item you want to sort.
3.  The app will analyze the image, classify the item (e.g., Plastic, Organic, Electronic), and provide specific instructions on how to properly dispose of or recycle it.

### Tracking Impact & Finding Resources
1.  Navigate to the **Impact Dashboard** to view your cumulative positive impact on the environment.
2.  Use the **Map** tab to search for nearby recycling facilities, clothing banks, or donation centers. You can filter by facility type and get driving directions.

### Playing & Learning
1.  Open the **EcoLand** section.
2.  Explore different ecological territories, complete trivia quizzes about waste management, and earn XP to level up your environmental knowledge.

## Development Setup

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed:

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```

## Configuration & API Keys

EarthIQ requires certain API keys to function correctly (e.g., Google Maps Platform).

1.  Create a `.env` file in the root directory (based on `.env.example`).
2.  Add your necessary environment variables, ensuring they are prefixed correctly (e.g., `VITE_GOOGLE_MAPS_PLATFORM_KEY`).

### ⚠️ Security Warning
**NEVER commit your `.env` file or API keys to version control.** Always use the `.env.example` file to document required variables without exposing your actual credentials.
