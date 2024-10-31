import { dbStatus } from './stores/dbStatus';

export function checkDbStatus() {
	setInterval(async () => {
		try {
			const response = await fetch('/api/health-check/db');
			dbStatus.set(response.ok);
		} catch (error) {
			console.error('Error checking DB status:', error);
			dbStatus.set(false);
		}
	}, 5000);
}
