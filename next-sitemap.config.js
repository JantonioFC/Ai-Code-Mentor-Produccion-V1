/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://aicodementor.com',
    generateRobotsTxt: true,
    exclude: ['/admin/*', '/api/*', '/panel-de-control'], // Exclude private/api routes
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api', '/panel-de-control'],
            },
        ],
    },
}
