import { json, type RequestHandler } from '@sveltejs/kit';
import { validateProfile } from '$lib/server/server-utils';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const validationResponse = await validateProfile(JSON.stringify(body));

	if (!validationResponse.success) {
		if (typeof validationResponse.errors === 'string') {
			return json({ errors: validationResponse.errors }, { status: 500 });
		}
		return json({ success: false, errors: validationResponse.errors }, { status: 422 });
	}

	return json({ success: true });
};
