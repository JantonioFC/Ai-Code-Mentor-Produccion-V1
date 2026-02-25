const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'ai-code-mentor.db');
const db = new Database(dbPath, { verbose: console.log });

try {
    const row = db.prepare('SELECT count(*) as count FROM generated_content').get();
    console.log('Generated content count:', row.count);

    if (row.count > 0) {
        const content = db.prepare('SELECT * FROM generated_content ORDER BY id DESC LIMIT 1').get();
        console.log('Latest entry metadata:', {
            id: content.id,
            user_id: content.user_id,
            semana_id: content.semana_id,
            dia_index: content.dia_index,
            pomodoro_index: content.pomodoro_index,
            created_at: content.created_at
        });
        console.log('Latest entry RAW content (first 200 chars):', JSON.stringify(content.content).substring(0, 200));

        try {
            const parsed = JSON.parse(content.content);
            console.log('Parsed content keys:', Object.keys(parsed));
            console.log('Parsed content.lesson preview:', parsed.lesson ? parsed.lesson.substring(0, 100) : 'undefined');
        } catch (e) {
            console.error('Failed to parse content JSON:', e.message);
        }
    } else {
        console.log('Table is empty.');
    }
} catch (error) {
    console.error('Error querying database:', error);
}
