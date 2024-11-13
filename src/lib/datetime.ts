export function timestampToDatetime(timestamp: string): string {
	const date = new Date(parseInt(timestamp) * 1000);
	const dateString = date.toISOString().substring(0, 10);
	const timeString = date.toISOString().substring(11, 19);
	return `${dateString} ${timeString}`;
}
