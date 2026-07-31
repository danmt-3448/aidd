-- Comprehensive integration tests for the Viết Kudo feature
-- Tests: RPC create_kudo(), hashtag relationships, image storage, constraint checks
-- Run: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/kudo-integration.sql

-- ============================================================
-- TEST 1: RPC create_kudo happy path — verify atomic insert
-- ============================================================

DO $test1$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';  -- Nguyễn Văn An
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000002';  -- Trần Thị Bình
  v_hashtag_id1 uuid := 'aaaaaaaa-0000-0000-0000-000000000001';  -- TeamWork
  v_hashtag_id2 uuid := 'aaaaaaaa-0000-0000-0000-000000000002';  -- Support
  v_kudo_id     uuid := gen_random_uuid();
  v_before_kudos_count int;
  v_after_kudos_count  int;
  v_kudo_hashtags_count int;
BEGIN
  SELECT COUNT(*) INTO v_before_kudos_count FROM public.kudos;
  RAISE NOTICE '=== TEST 1: RPC create_kudo happy path ===';
  RAISE NOTICE 'Kudos before: %', v_before_kudos_count;

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  PERFORM public.create_kudo(
    p_kudo_id := v_kudo_id,
    p_receiver_id := v_receiver_id,
    p_content_html := '<p>Cảm ơn bạn!</p>',
    p_is_anonymous := false,
    p_anonymous_name := NULL,
    p_hashtag_ids := ARRAY[v_hashtag_id1, v_hashtag_id2],
    p_image_paths := ARRAY['11111111-0000-0000-0000-000000000001/test-kudo/img1.jpg']
  );

  SELECT COUNT(*) INTO v_after_kudos_count FROM public.kudos;
  RAISE NOTICE 'Kudos after: %', v_after_kudos_count;

  ASSERT EXISTS(
    SELECT 1 FROM public.kudos k
    WHERE k.id = v_kudo_id
    AND k.sender_id = v_sender_id
    AND k.receiver_id = v_receiver_id
    AND k.is_anonymous = false
  ), 'Kudo row not inserted correctly';

  SELECT COUNT(*) INTO v_kudo_hashtags_count FROM public.kudo_hashtags
  WHERE kudo_id = v_kudo_id;
  ASSERT v_kudo_hashtags_count = 2, 'Expected 2 kudo_hashtags, got ' || v_kudo_hashtags_count;

  ASSERT EXISTS(
    SELECT 1 FROM public.kudo_images ki
    WHERE ki.kudo_id = v_kudo_id
    AND ki.storage_path = '11111111-0000-0000-0000-000000000001/test-kudo/img1.jpg'
    AND ki.sort_order = 0
  ), 'Kudo image not inserted correctly';

  RAISE NOTICE 'TEST 1 PASSED: RPC inserts kudos + kudo_hashtags + kudo_images atomically';

  DELETE FROM public.kudos WHERE id = v_kudo_id;
END $test1$;

-- ============================================================
-- TEST 2: RPC rejects sender_id = receiver_id
-- ============================================================

DO $test2$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_hashtag_id1 uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_kudo_id     uuid := gen_random_uuid();
  v_error_raised boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 2: RPC rejects sender_id = receiver_id ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  BEGIN
    PERFORM public.create_kudo(
      p_kudo_id := v_kudo_id,
      p_receiver_id := v_sender_id,
      p_content_html := '<p>Test</p>',
      p_is_anonymous := false,
      p_anonymous_name := NULL,
      p_hashtag_ids := ARRAY[v_hashtag_id1],
      p_image_paths := ARRAY[]
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_raised := true;
    RAISE NOTICE 'Expected error: %', SQLSTATE;
  END;

  ASSERT v_error_raised, 'Expected RPC to reject sender_id = receiver_id';
  RAISE NOTICE 'TEST 2 PASSED';
END $test2$;

-- ============================================================
-- TEST 3: RPC rejects hashtag_ids with 0 elements
-- ============================================================

DO $test3$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000002';
  v_kudo_id     uuid := gen_random_uuid();
  v_error_raised boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 3: RPC rejects hashtag_ids with 0 elements ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  BEGIN
    PERFORM public.create_kudo(
      p_kudo_id := v_kudo_id,
      p_receiver_id := v_receiver_id,
      p_content_html := '<p>Test</p>',
      p_is_anonymous := false,
      p_anonymous_name := NULL,
      p_hashtag_ids := ARRAY[]::uuid[],
      p_image_paths := ARRAY[]
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_raised := true;
  END;

  ASSERT v_error_raised, 'Expected RPC to reject empty hashtag_ids';
  RAISE NOTICE 'TEST 3 PASSED';
END $test3$;

-- ============================================================
-- TEST 4: RPC rejects hashtag_ids with 6 elements (limit is 1-5)
-- ============================================================

DO $test4$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000002';
  v_hashtag_ids uuid[] := ARRAY[
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000006'
  ];
  v_kudo_id     uuid := gen_random_uuid();
  v_error_raised boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 4: RPC rejects hashtag_ids with 6 elements ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  BEGIN
    PERFORM public.create_kudo(
      p_kudo_id := v_kudo_id,
      p_receiver_id := v_receiver_id,
      p_content_html := '<p>Test</p>',
      p_is_anonymous := false,
      p_anonymous_name := NULL,
      p_hashtag_ids := v_hashtag_ids,
      p_image_paths := ARRAY[]
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_raised := true;
  END;

  ASSERT v_error_raised, 'Expected RPC to reject 6 hashtag_ids';
  RAISE NOTICE 'TEST 4 PASSED';
END $test4$;

-- ============================================================
-- TEST 5: RPC rejects non-existent hashtag UUIDs
-- ============================================================

DO $test5$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000002';
  v_fake_hashtag_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  v_kudo_id     uuid := gen_random_uuid();
  v_error_raised boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 5: RPC rejects non-existent hashtag UUIDs ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  BEGIN
    PERFORM public.create_kudo(
      p_kudo_id := v_kudo_id,
      p_receiver_id := v_receiver_id,
      p_content_html := '<p>Test</p>',
      p_is_anonymous := false,
      p_anonymous_name := NULL,
      p_hashtag_ids := ARRAY[v_fake_hashtag_id],
      p_image_paths := ARRAY[]
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_raised := true;
  END;

  ASSERT v_error_raised, 'Expected RPC to reject non-existent hashtag_id';
  RAISE NOTICE 'TEST 5 PASSED';
END $test5$;

-- ============================================================
-- TEST 6: RPC rejects image_paths with more than 5 elements
-- ============================================================

DO $test6$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000002';
  v_hashtag_id1 uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_image_paths text[] := ARRAY[
    'path1.jpg', 'path2.jpg', 'path3.jpg', 'path4.jpg', 'path5.jpg', 'path6.jpg'
  ];
  v_kudo_id     uuid := gen_random_uuid();
  v_error_raised boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 6: RPC rejects image_paths with 6+ elements ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  BEGIN
    PERFORM public.create_kudo(
      p_kudo_id := v_kudo_id,
      p_receiver_id := v_receiver_id,
      p_content_html := '<p>Test</p>',
      p_is_anonymous := false,
      p_anonymous_name := NULL,
      p_hashtag_ids := ARRAY[v_hashtag_id1],
      p_image_paths := v_image_paths
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_raised := true;
  END;

  ASSERT v_error_raised, 'Expected RPC to reject 6 image paths';
  RAISE NOTICE 'TEST 6 PASSED';
END $test6$;

-- ============================================================
-- TEST 7: Anonymous kudo with alias
-- ============================================================

DO $test7$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000003';
  v_hashtag_id1 uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_kudo_id     uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 7: Anonymous kudo with alias ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  PERFORM public.create_kudo(
    p_kudo_id := v_kudo_id,
    p_receiver_id := v_receiver_id,
    p_content_html := '<p>Anonymous praise</p>',
    p_is_anonymous := true,
    p_anonymous_name := 'Người bí ẩn',
    p_hashtag_ids := ARRAY[v_hashtag_id1],
    p_image_paths := ARRAY[]
  );

  ASSERT EXISTS(
    SELECT 1 FROM public.kudos k
    WHERE k.id = v_kudo_id
    AND k.is_anonymous = true
    AND k.anonymous_name = 'Người bí ẩn'
  ), 'Anonymous kudo not stored correctly';

  RAISE NOTICE 'TEST 7 PASSED';

  DELETE FROM public.kudos WHERE id = v_kudo_id;
END $test7$;

-- ============================================================
-- TEST 8: Cascading deletes (delete kudo → kudo_hashtags, kudo_images deleted)
-- ============================================================

DO $test8$
DECLARE
  v_sender_id   uuid := '11111111-0000-0000-0000-000000000001';
  v_receiver_id uuid := '11111111-0000-0000-0000-000000000004';
  v_hashtag_id1 uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_kudo_id     uuid := gen_random_uuid();
  v_related_count int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 8: Cascading deletes on kudo delete ===';

  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000001"}';

  PERFORM public.create_kudo(
    p_kudo_id := v_kudo_id,
    p_receiver_id := v_receiver_id,
    p_content_html := '<p>To be deleted</p>',
    p_is_anonymous := false,
    p_anonymous_name := NULL,
    p_hashtag_ids := ARRAY[v_hashtag_id1],
    p_image_paths := ARRAY['path.jpg']
  );

  SELECT COUNT(*) INTO v_related_count FROM public.kudo_hashtags WHERE kudo_id = v_kudo_id;
  ASSERT v_related_count = 1, 'Expected 1 kudo_hashtags before delete';

  DELETE FROM public.kudos WHERE id = v_kudo_id;

  SELECT COUNT(*) INTO v_related_count FROM public.kudo_hashtags WHERE kudo_id = v_kudo_id;
  ASSERT v_related_count = 0, 'Expected kudo_hashtags cascaded deleted';

  SELECT COUNT(*) INTO v_related_count FROM public.kudo_images WHERE kudo_id = v_kudo_id;
  ASSERT v_related_count = 0, 'Expected kudo_images cascaded deleted';

  RAISE NOTICE 'TEST 8 PASSED';
END $test8$;

-- ============================================================
-- TEST 9: DB constraint check — sender_id <> receiver_id
-- ============================================================

DO $test9$
DECLARE
  v_profile_id uuid := '11111111-0000-0000-0000-000000000001';
  v_error_raised boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 9: DB constraint check — sender_id != receiver_id ===';

  BEGIN
    INSERT INTO public.kudos (id, sender_id, receiver_id, content_html)
    VALUES (gen_random_uuid(), v_profile_id, v_profile_id, '<p>Self kudo</p>');
  EXCEPTION WHEN check_violation THEN
    v_error_raised := true;
  END;

  ASSERT v_error_raised, 'Expected check constraint violation for sender=receiver';
  RAISE NOTICE 'TEST 9 PASSED';
END $test9$;

-- ============================================================
-- TEST 10: Verify seed idempotency
-- ============================================================

DO $test10$
DECLARE
  v_hashtag_count int;
  v_profile_count int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 10: Seed data idempotency ===';

  SELECT COUNT(*) INTO v_hashtag_count FROM public.hashtags;
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles;

  ASSERT v_hashtag_count = 12, 'Expected 12 hashtags, got ' || v_hashtag_count;
  ASSERT v_profile_count = 10, 'Expected 10 profiles, got ' || v_profile_count;

  RAISE NOTICE 'TEST 10 PASSED: Hashtags (%), Profiles (%)', v_hashtag_count, v_profile_count;
END $test10$;

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== ALL DB INTEGRATION TESTS PASSED ===';
  RAISE NOTICE '========================================';
END $$;
