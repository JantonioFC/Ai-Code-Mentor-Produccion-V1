/**
 * SCRIPT: GENERATE SOCIAL POSTS
 * 
 * Purpose: Automate the creation of "Tip of the Day" content for LinkedIn/Twitter
 * based on the existing curriculum (Weeks/Days).
 * 
 * Workflow:
 * 1. Read `semanas` and `esquema_diario` from SQLite.
 * 2. Apply a "Social Template" to the educational content.
 * 3. Output a queue of posts to `content/social/posts.json`.
 */

const db = require('../lib/db');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(process.cwd(), 'content', 'social', 'posts.json');

async function generateSocialPosts() {
    console.log('🚀 Starting Social Content Generation...');

    try {
        // 1. Fetch Source Content (Weeks & Daily Concepts)
        const weeks = db.query(`
      SELECT 
        s.id as week_id, 
        s.titulo_semana, 
        s.tematica,
        m.titulo_modulo
      FROM semanas s
      JOIN modulos m ON s.modulo_id = m.id
    `);

        const days = db.query(`
      SELECT 
        d.dia, 
        d.concepto, 
        s.titulo_semana
      FROM esquema_diario d
      JOIN semanas s ON d.semana_id = s.id
    `);

        console.log(`📚 Found ${weeks.length} weeks and ${days.length} daily concepts.`);

        const postQueue = [];

        // 2. Generate "Week Kickoff" Posts (LinkedIn Style - Long Form)
        weeks.forEach(week => {
            postQueue.push({
                id: `week-${week.week_id}-kickoff`,
                platform: 'LinkedIn',
                type: 'Kickoff',
                content: generateLinkedInTemplate(week)
            });
        });

        // 3. Generate "Daily Tip" Posts (Twitter Style - Short Form)
        days.forEach((day, index) => {
            postQueue.push({
                id: `day-${index}-tip`,
                platform: 'Twitter',
                type: 'Tip',
                content: generateTwitterTemplate(day)
            });
        });

        // 4. Save Queue
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(postQueue, null, 2));
        console.log(`✅ Generated ${postQueue.length} posts. Saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Error generating content:', error);
        process.exit(1);
    }
}

// --- TEMPLATES ---

function generateLinkedInTemplate(week) {
    const hashtags = `#${week.titulo_modulo.replace(/\s+/g, '')} #Learning #AI`;
    return `🚀 Semana Nueva: ${week.titulo_semana}

Esta semana nos enfocamos en: ${week.tematica}.

Como parte del programa AI Code Mentor, profundizaremos en los fundamentos que separan a los codificadores junior de los ingenieros senior.

¿Listo para el desafío? 

${hashtags}`;
}

function generateTwitterTemplate(day) {
    const hashtags = `#DevTips #CodeNewbie`;
    return `💡 Tip del Día: ${day.concepto}

En el contexto de ${day.titulo_semana}, entender este concepto es clave para dominar el flujo de trabajo moderno.

${hashtags}`;
}

// Run
generateSocialPosts();
