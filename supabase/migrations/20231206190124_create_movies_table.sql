create extension if not exists vector;

create table public.movies (
                               imdbID varchar primary key,
                               content jsonb,
                               token_count int,
                               embedding vector(1536)
);
