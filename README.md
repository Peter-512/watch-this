# How it works

### Original

This project uses the OpenAI GPT-3 API (specifically, text-davinci-003) and Vercel Edge functions with streaming. 
It generates 5 cinema recommendations based on the form and user input, sends it to the GPT-3 API via a Vercel Edge function, 
then streams the response back to the application.

### Additions

First, we added a database to allow users to upload movie titles that they own. 
When they do that, we check if the movie is already in the database. If it is we can skip the remaining steps.
If it is not we use the OMDB API to get all kinds of movie details.
We then generate embeddings for those details using OpenAI's text-embedding-ada-002 model.
We then store the title, details and embeddings in the database.

Then we implemented a chat interface to allow users to get recommendations about their movies.
We use the same embedding model to generate embeddings for the user's input.
We then use cosine similarity to find the movies in the database that are most similar to the user's input.
We also use the YouTube API to get the trailer for the movie.
Then we use the gpt-3.5-turbo model to generate a response to the user's input using the details of the .

# Running Locally

First, install the dependencies:

`pnpm i`

Start the local database docker container (make sure docker is running):

`supabase start`

This will start the database and do all necessary migrations and seeding.
If you want to inspect the database the dashboard is available at http://localhost:54323.

Then, create a `.env` file and copy the contents of `.env.example` into it.
Add all missing values.

Then, run the following command and it will be available at http://localhost:5173.

`pnpm run dev`
