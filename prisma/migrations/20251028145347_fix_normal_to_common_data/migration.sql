-- Data migration: Update 'normal' rarity values to 'common'
UPDATE observations SET rarity = 'common' WHERE rarity = 'normal';
