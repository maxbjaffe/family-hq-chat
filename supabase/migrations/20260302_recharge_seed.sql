-- Kids Recharge Menu — foundation break seed data
-- Run this in Supabase Dashboard SQL Editor AFTER 20260302_recharge_menu.sql
-- 36 foundation breaks: child_id = NULL, is_foundation = true, source = 'foundation'

-- ============================================================
-- 5-MINUTE BREAKS (11 breaks)
-- ============================================================

-- ENERGY (4)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'energy', 5, 'Dance Break', '💃', 'Pick your favorite song and dance like nobody''s watching for one whole track!', true, 'foundation', 1),
  (NULL, 'energy', 5, 'Jaffe Sprint', '🏃', 'Race Jaffe around the backyard — first one to the fence and back wins!', true, 'foundation', 2),
  (NULL, 'energy', 5, 'Living Room Gymnastics', '🤸', 'Cartwheels, handstands, somersaults — turn the living room into your gym!', true, 'foundation', 3),
  (NULL, 'energy', 5, 'Lip Sync Battle', '🎤', 'Grab a hairbrush mic and perform your heart out to a favorite tune!', true, 'foundation', 4);

-- CALM (4)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'calm', 5, 'Star Breathing', '🌟', 'Trace a star shape slowly — breathe in on the points, out on the valleys. Five times.', true, 'foundation', 5),
  (NULL, 'calm', 5, 'Jaffe Cuddle Break', '🐶', 'Find Jaffe and give him the best belly rubs and snuggles for five minutes.', true, 'foundation', 6),
  (NULL, 'calm', 5, 'Plant Check', '🌿', 'Visit the houseplants — give them water if they need it and check for new growth!', true, 'foundation', 7),
  (NULL, 'calm', 5, 'Quick Doodle', '🎨', 'Grab a piece of paper and draw the first thing that pops into your head. No erasing!', true, 'foundation', 8);

-- FUN (3)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'fun', 5, 'Riddle Challenge', '🧩', 'Ask Alexa or look up a riddle — see if you can stump a family member!', true, 'foundation', 9),
  (NULL, 'fun', 5, 'Joke Swap', '😂', 'Find your best joke and tell it to someone. Bonus points if they laugh so hard they snort!', true, 'foundation', 10),
  (NULL, 'fun', 5, 'Quick Game Round', '📱', 'One quick round of your favorite game — just one!', true, 'foundation', 11);

-- ============================================================
-- 10-MINUTE BREAKS (10 breaks)
-- ============================================================

-- ENERGY (3)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'energy', 10, 'Dance Party: Full Set', '🎶', 'Two or three songs back to back — make a mini playlist and dance through the whole thing!', true, 'foundation', 12),
  (NULL, 'energy', 10, 'Backyard Challenge', '⚽', 'Soccer kicks, basketball shots, or obstacle course — pick your challenge and beat your record!', true, 'foundation', 13),
  (NULL, 'energy', 10, 'Sibling Challenge', '🤼', 'Challenge a sibling to a push-up contest, race, or any mini competition. Loser picks up the playroom!', true, 'foundation', 14);

-- CALM (4)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'calm', 10, 'Reading Break', '📖', 'Grab your current book, find a cozy spot, and read a chapter or a few pages.', true, 'foundation', 15),
  (NULL, 'calm', 10, 'Art Break', '🎨', 'Colored pencils, markers, or watercolors — spend ten minutes making something beautiful.', true, 'foundation', 16),
  (NULL, 'calm', 10, 'Garden Walk', '🌺', 'Take a slow walk around the yard. Notice what''s blooming, what''s buzzing, what''s changed.', true, 'foundation', 17),
  (NULL, 'calm', 10, 'Chill Playlist', '🎵', 'Put on your favorite chill music, lie down, close your eyes, and just breathe.', true, 'foundation', 18);

-- CREATIVE (2)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'creative', 10, 'Build Something', '🔨', 'LEGOs, blocks, cardboard — grab whatever''s around and build something awesome in ten minutes.', true, 'foundation', 19),
  (NULL, 'creative', 10, 'Story Starter', '✍️', 'Write the opening paragraph of a wild story. Aliens? Dragons? Time travel? You pick!', true, 'foundation', 20);

-- FUN (1)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'fun', 10, 'Trivia Blast', '🧠', 'Look up fun trivia questions and quiz your family. Keep score — winner gets bragging rights!', true, 'foundation', 21);

-- ============================================================
-- 15-MINUTE BREAKS (9 breaks)
-- ============================================================

-- ENERGY (3)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'energy', 15, 'Outdoor Adventure', '🚴', 'Bike ride, scooter loop, or a jog around the block — get outside and move!', true, 'foundation', 22),
  (NULL, 'energy', 15, 'Talent Show Rehearsal', '🎭', 'Practice a skit, dance routine, or magic trick. Family show tonight!', true, 'foundation', 23),
  (NULL, 'energy', 15, 'Game Time', '🎲', 'Quick card game, UNO, or a fast board game round with a sibling.', true, 'foundation', 24);

-- CALM (2)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'calm', 15, 'Journal Time', '📓', 'Write about your day, draw your mood, or make a list of things you''re grateful for.', true, 'foundation', 25),
  (NULL, 'calm', 15, 'Snack Creation', '🍳', 'Make yourself a fancy snack — ants on a log, fruit art, or a mini sandwich masterpiece.', true, 'foundation', 26);

-- FUN (1)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'fun', 15, 'Photo Scavenger Hunt', '📸', 'Find and photograph 5 things: something red, something tiny, something that makes you smile, something old, something silly.', true, 'foundation', 27);

-- CREATIVE (3)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'creative', 15, 'Mini Research', '🔬', 'Pick something you''re curious about and look it up. Sharks? Volcanoes? How gum is made? Go learn!', true, 'foundation', 28),
  (NULL, 'creative', 15, 'Short Video Learn', '🎥', 'Watch one educational video — a cool science experiment, art tutorial, or how-things-work clip.', true, 'foundation', 29),
  (NULL, 'creative', 15, 'Teach Jaffe a Trick', '🧱', 'Grab some treats and spend fifteen minutes teaching Jaffe something new. Shake? Spin? High five?', true, 'foundation', 30);

-- ============================================================
-- 30-MINUTE BREAKS (9 breaks)
-- ============================================================

-- ENERGY (2)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'energy', 30, 'Big Outdoor Session', '🏞️', 'Full outdoor play — bike ride, basketball, tag, whatever gets your heart pumping for a solid half hour.', true, 'foundation', 31),
  (NULL, 'energy', 30, 'Full Production', '🎭', 'Write, rehearse, and perform a short skit or dance number. Costumes encouraged!', true, 'foundation', 32);

-- FUN (2)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'fun', 30, 'Board Game Tournament', '🎲', 'Pick a board game and play a full round. Monopoly Deal, Uno, Sorry — your call!', true, 'foundation', 33),
  (NULL, 'fun', 30, 'Full Reset Combo', '🧘', 'The ultimate recharge: 10 min outside + 10 min snack + 10 min chill music. Come back brand new.', true, 'foundation', 34);

-- CREATIVE (3)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'creative', 30, 'Art Project', '🎨', 'Start a real art project — painting, collage, clay, or whatever inspires you. Take your time!', true, 'foundation', 35),
  (NULL, 'creative', 30, 'Story Writing', '📝', 'Write a short story from beginning to end. Give it a title and everything!', true, 'foundation', 36),
  (NULL, 'creative', 30, 'Baking Break', '🍳', 'Pick a simple recipe and bake something yummy. Cookies, muffins, or banana bread!', true, 'foundation', 37);

-- CALM (2)
INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order)
VALUES
  (NULL, 'calm', 30, 'Movie Snack Break', '🎬', 'Pick a show episode or short movie, make some popcorn, and fully zone out. You''ve earned it.', true, 'foundation', 38),
  (NULL, 'calm', 30, 'Room Makeover', '🛍️', 'Rearrange your desk, organize your shelves, or redecorate a corner of your room. Make it yours!', true, 'foundation', 39);
