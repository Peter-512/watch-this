create extension if not exists vector with schema public;

create table public.movies (
                               imdbID varchar primary key,
                               content jsonb NOT NULL,
                               token_count int NOT NULL,
                               embedding vector(1536) NOT NULL
);
