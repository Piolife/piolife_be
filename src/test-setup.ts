// Sets required env vars before any module-level guards run during tests.
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_key_for_tests_only';
process.env.JWT_SECRET = 'test_jwt_secret_min_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.STREAM_API_KEY = 'test_stream_key';
process.env.STREAM_API_SECRET = 'test_stream_secret';
