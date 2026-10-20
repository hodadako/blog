-- Remove the unused post-view feature and erase its stored visit details/counts.
drop function if exists record_post_view(text, text, text, text, text);
drop function if exists increment_post_view_count(text);
drop table if exists post_view_events;
alter table post_threads drop column if exists view_count;
