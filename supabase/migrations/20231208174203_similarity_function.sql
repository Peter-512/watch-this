create or replace function find_closest_movies(embedding vector (1536), match_threshold float, match_count int)
returns table (content jsonb, similarity float)
language plpgsql
as $$
#variable_conflict use_variable
begin
    return query
    select
        movies.content,
        (movies.embedding <#> embedding) * -1 as similarity
    from movies

    -- The dot product is negative because of a Postgres limitation, so we negate it
    where (movies.embedding <#> embedding) * -1 > match_threshold

    -- OpenAI embeddings are normalized to length 1, so
    -- cosine similarity and dot product will produce the same results.
    -- Using dot product which can be computed slightly faster.
    -- For the different syntaxes, see https://github.com/pgvector/pgvector
    order by movies.embedding <#> embedding
    limit match_count;
end;
$$;