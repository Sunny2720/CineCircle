# CineCircle Requirements

## 1. Product Overview

CineCircle is a social movie recommendation and playlist app. Users can create collections of movies, keep them private or publish them, share public collections, and invite other people to contribute movies.

## 2. Goals

- Make it easy to collect and organize movies around a theme, mood, event, or group.
- Let users discover recommendations from people and communities they trust.
- Support both personal watchlists and collaborative movie playlists.
- Give playlist owners clear control over visibility and contribution permissions.

## 3. Users and Permissions

### 3.1 Visitor

- Browse public playlists and their movie contents.
- View public playlist details, owner, contributors, and recommendations.
- Share public playlist links.
- Sign up or sign in to create playlists and contribute.

### 3.2 Signed-in User

- Create, edit, and delete playlists they own.
- Add, remove, and reorder movies in playlists they own.
- Set a playlist to private or public.
- View and manage their own private playlists.
- Share public playlists.
- Request or accept collaboration access when supported by the product flow.
- Add movies to public collaborative playlists when the owner allows contributions.
- Remove their own contributions where appropriate.

### 3.3 Playlist Owner

- Change playlist title, description, cover image, and visibility.
- Enable or disable contributions.
- Invite or remove contributors.
- Remove any movie from the playlist.
- Remove contributors from the playlist.
- Delete the playlist.

### 3.4 Contributor

- View the collaborative playlist.
- Add movies when contribution access is enabled.
- See who added each movie.
- Remove movies they personally added, unless restricted by the owner.

## 4. Core Functional Requirements

### FR-001: Account Creation and Authentication

Users must be able to create an account, sign in, sign out, and recover access to their account.

### FR-002: Create a Playlist

A signed-in user must be able to create a playlist with:

- Required title
- Optional description
- Optional cover image
- Owner
- Visibility setting
- Contribution setting

### FR-003: Manage Playlist Visibility

Each playlist must support:

- **Private:** Only the owner and explicitly authorized collaborators can view it.
- **Public:** Anyone with access to the app can view it and share it.

Changing visibility must take effect for future access immediately.

### FR-004: Add Movies

Users must be able to search for movies and add a selected movie to a playlist. A movie entry should display, when available:

- Title
- Poster
- Release year
- Short description
- Genres
- Rating
- Movie details link

The same movie should not be added to the same playlist more than once.

Movie search and metadata should be powered by the selected movie data provider, initially TMDB. The application should use the provider's stable movie identifier when storing a movie and should not create duplicate movie records for the same provider identifier.

### FR-005: Organize Playlist Movies

Playlist owners must be able to remove movies and change their order. The playlist must preserve the selected order for all viewers.

### FR-006: Collaborative Contributions

Playlist owners must be able to enable contributions. For a public playlist with contributions enabled, authorized contributors must be able to add movies. Each added movie must record its contributor and creation time.

The owner must be able to disable contributions without deleting existing movies.

### FR-007: Share Public Playlists

Users must be able to copy or share a stable link to a public playlist. Shared links must open the playlist without requiring sign-in.

Private playlist links must not expose playlist contents to unauthorized users.

### FR-008: Browse and Discover

Users and visitors must be able to browse public playlists and filter or search by relevant information such as playlist title, movie title, genre, or owner.

### FR-009: Playlist Details

A playlist details page must show:

- Playlist title and description
- Cover image
- Owner
- Visibility
- Movie list and ordering
- Contributors
- Contribution status
- Share action for public playlists

### FR-010: Ownership and Access Control

The system must enforce authorization on the server for every playlist read and write operation. Client-side controls must not be treated as security boundaries.

### FR-011: User Movie Preferences and Ratings

Signed-in users must be able to maintain their personal preference and viewing status for movies:

- Mark a movie as liked or not liked.
- Mark a movie as viewed or not viewed.
- Give a viewed movie a personal five-star rating from 0.5 to 5 stars in 0.5-star increments.
- Update or remove their own like, viewed status, and rating at any time.

Ratings and viewing status must be private to the user unless the product explicitly exposes them through a future social feature. A user must not be able to change another user's preferences or ratings.

### FR-012: Movie Catalog and Trailer Integration

The application must integrate with TMDB for movie catalog data and must:

- Search and paginate movie results through the TMDB API.
- Retrieve movie titles, descriptions, release dates or years, genres, ratings, poster paths, and backdrop paths when available.
- Retrieve and store an optional IMDb identifier for cross-reference.
- Retrieve an optional YouTube trailer identifier from the movie's video results.
- Open trailers using the YouTube embedded player without downloading or re-hosting the video.
- Show a clear fallback state when a movie has no poster, thumbnail, or trailer.
- Keep TMDB and YouTube credentials on the server and never expose them in client-side code.

The integration must support replacing TMDB with another provider in the future without changing playlist, preference, or rating ownership semantics.

## 5. MVP Screens

- Landing or public discovery page
- Sign-up and sign-in pages
- User dashboard
- Create playlist page
- Playlist details page
- Edit playlist page
- Movie search and add flow
- Movie details and trailer view
- Collaboration and contributor management controls

## 6. Data Model

The initial data model should support at least:

- User
- Movie
- Playlist
- PlaylistMovie
- PlaylistContributor
- UserMoviePreference, including user, movie, liked status, viewed status, personal rating, and timestamps
- MovieProviderReference, including provider name, provider movie identifier, optional IMDb identifier, metadata timestamps, poster and backdrop paths, and optional YouTube trailer identifier
- Shareable playlist identifier or slug

A `PlaylistMovie` record should preserve playlist order, the user who added the movie, and timestamps.
User movie preferences should be unique per user and movie. A personal rating should be nullable and valid only in the range 0.5 to 5.0, using 0.5 increments. A rating should normally require the movie to be marked as viewed.
Movie provider identifiers should be unique per provider. Provider metadata should be refreshable, and missing images or trailers must be supported without preventing a movie from being added.

## 7. Non-Functional Requirements

- Responsive experience on desktop and mobile.
- Accessible keyboard navigation, labels, focus states, and sufficient color contrast.
- Clear empty, loading, error, and unauthorized states.
- Avoid exposing private playlist data in search results, metadata, previews, or share links.
- Validate and authorize all user-controlled input on the server.
- Use pagination or lazy loading for large public playlist and movie results.
- Keep movie data attribution and API usage compliant with the selected movie data provider.
- Display required TMDB attribution when TMDB data or images are used.
- Treat TMDB data as provider content: do not use it to train recommendation models, do not cache it longer than the provider permits, and keep the MVP non-commercial.
- Follow YouTube API and embedded-player terms when displaying trailers, including preserving YouTube branding and player controls.

## 8. MVP Success Criteria

- A new user can create a playlist and add movies to it.
- A playlist owner can switch a playlist between private and public.
- A visitor can open and view a public playlist through a shared link.
- An owner can enable contributions and another signed-in user can add a movie.
- Unauthorized users cannot view or modify private playlists.
- The owner can remove contributors, remove movies, reorder movies, and disable contributions.
- Users can search TMDB movies, add a result to a playlist, view its poster when available, and open its YouTube trailer when available.
- Public playlist content remains usable on mobile and desktop.

## 9. Future Enhancements

- Likes, comments, and reactions.
- Following users and playlist notifications.
- Collaborative voting or movie ranking.
- Import from existing watchlists.
- Integrations with streaming services.
- A recommendation engine that uses each user's likes, viewed status, and half-star ratings to suggest movies matching their taste.
- An optional AI movie-suggestion assistant that turns a user's mood, theme, group, and viewing constraints into editable playlist ideas and TMDB search queries. It must use only data the user is authorized to access, keep personal preferences private, and treat TMDB as the source of truth for movie metadata.
- Activity feed.
- Real-time collaborative updates.
- Playlist version history and moderation tools.
