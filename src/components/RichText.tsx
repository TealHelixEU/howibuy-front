/**
 * Renders text the API serves as rich text, formatting and all.
 *
 * The content is authored in the backend repository and seeded from there, so it is trusted to the same degree as this
 * application's own source and is inserted without sanitizing. This is the only place that assumes that: if the compass
 * ever serves content from anywhere a user can reach, sanitizing belongs here.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
	return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
