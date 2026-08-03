create or replace function upsert_quiz_question_with_options(
  input_question_id uuid,
  input_category_code text,
  input_type text,
  input_prompt text,
  input_explanation text,
  input_difficulty integer,
  input_active boolean,
  input_options jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  category_id_value uuid;
  question_id_value uuid;
  option_item jsonb;
  option_count integer;
  correct_count integer;
  expected_order integer := 1;
begin
  if input_category_code is null or input_category_code !~ '^[A-Z][A-Z0-9_]*$'
    or char_length(input_category_code) not between 2 and 32
    or input_type not in ('TEXT_MULTIPLE_CHOICE', 'IMAGE_MULTIPLE_CHOICE')
    or char_length(btrim(input_prompt)) not between 1 and 1000
    or input_difficulty not between 1 and 5
    or jsonb_typeof(input_options) <> 'array'
    or jsonb_array_length(input_options) <> 5 then
    raise exception 'invalid-quiz-question-input' using errcode = '22023';
  end if;

  select id into category_id_value from quiz_categories where code = input_category_code;
  if not found then
    raise exception 'quiz-category-not-found' using errcode = 'P0001';
  end if;

  select count(*), count(*) filter (where coalesce((item->>'isCorrect')::boolean, false))
    into option_count, correct_count
  from jsonb_array_elements(input_options) item;
  if option_count <> 5 or correct_count <> 1 then
    raise exception 'quiz-question-must-have-five-options-and-one-answer' using errcode = '23514';
  end if;

  if input_question_id is null then
    insert into quiz_questions (category_id, type, prompt, explanation, difficulty, active)
    values (category_id_value, input_type, btrim(input_prompt), coalesce(input_explanation, ''), input_difficulty, coalesce(input_active, true))
    returning id into question_id_value;
  else
    update quiz_questions
    set category_id = category_id_value,
        type = input_type,
        prompt = btrim(input_prompt),
        explanation = coalesce(input_explanation, ''),
        difficulty = input_difficulty,
        active = coalesce(input_active, true),
        version = version + 1,
        updated_at = clock_timestamp()
    where id = input_question_id
    returning id into question_id_value;
    if not found then
      raise exception 'quiz-question-not-found' using errcode = 'P0001';
    end if;
    delete from quiz_options where question_id = question_id_value;
  end if;

  for option_item in select * from jsonb_array_elements(input_options) loop
    if coalesce((option_item->>'displayOrder')::integer, 0) <> expected_order then
      raise exception 'quiz-option-order-must-be-one-to-five' using errcode = '22023';
    end if;
    if input_type = 'TEXT_MULTIPLE_CHOICE' and nullif(btrim(option_item->>'text'), '') is null then
      raise exception 'text-quiz-option-text-required' using errcode = '22023';
    end if;
    if input_type = 'IMAGE_MULTIPLE_CHOICE' and (nullif(btrim(option_item->>'imagePath'), '') is null or nullif(btrim(option_item->>'altText'), '') is null) then
      raise exception 'image-quiz-option-image-and-alt-required' using errcode = '22023';
    end if;
    insert into quiz_options (question_id, text, image_path, alt_text, label, is_correct, display_order)
    values (
      question_id_value,
      nullif(btrim(option_item->>'text'), ''),
      nullif(btrim(option_item->>'imagePath'), ''),
      nullif(btrim(option_item->>'altText'), ''),
      nullif(btrim(option_item->>'label'), ''),
      coalesce((option_item->>'isCorrect')::boolean, false),
      expected_order
    );
    expected_order := expected_order + 1;
  end loop;

  return jsonb_build_object('questionId', question_id_value, 'version', (select version from quiz_questions where id = question_id_value));
end;
$$;

revoke all on function upsert_quiz_question_with_options(uuid, text, text, text, text, integer, boolean, jsonb) from public, anon, authenticated;
grant execute on function upsert_quiz_question_with_options(uuid, text, text, text, text, integer, boolean, jsonb) to service_role;
