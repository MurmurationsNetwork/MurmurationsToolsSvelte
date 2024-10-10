import { json, type RequestHandler } from '@sveltejs/kit';
import { validateProfile } from '$lib/server/server-utils';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const validationResponse = await validateProfile(JSON.stringify(body));

		if (!validationResponse.success) {
			return json({ success: false, errors: validationResponse.errors }, { status: 422 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error validating profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
