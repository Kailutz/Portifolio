// Essas duas informações não são segredo — elas só dizem ao navegador
// ONDE conversar com o Supabase. Quem garante a senha é o próprio Supabase.
const SUPABASE_URL = 'https://fbbspdqztyxpiscrwjoi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnNwZHF6dHl4cGlzY3J3am9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTk4OTIsImV4cCI6MjEwMjgzNTg5Mn0.1ywai1DKjnJHIYANy8P8WOws2jXG64CvGdAIZYPmOyk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
