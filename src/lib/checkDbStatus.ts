import { dbStatus } from './stores/dbStatus';

export function checkDbStatus(): void {
	const checkStatus = async () => {
		try {
			const response = await fetch('/api/health-check/db');
			dbStatus.set(response.ok);
		} catch (error) {
			console.error('Error checking DB status:', error);
			dbStatus.set(false);
		}
	};

	// Immediately check DB status on load
	checkStatus();

	// Check DB status every 5 seconds
	setInterval(checkStatus, 5000);
}
