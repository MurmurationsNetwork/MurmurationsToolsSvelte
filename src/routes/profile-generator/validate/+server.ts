import { json, type RequestHandler } from '@sveltejs/kit';
import { validateProfile } from '$lib/server/server-utils';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	try {
		const validationResponse = await validateProfile(JSON.stringify(body));

		if (!validationResponse.success) {
			return json({ success: false, errors: validationResponse.errors }, { status: 422 });
		}

		return json({ success: true });
	} catch (err) {
		console.error(`Index service validation failed: ${err}`);
		return json(
			{
				success: false,
				errors: 'Unable to connect to Index service, please contact the administrator.'
			},
			{ status: 500 }
		);
	}
};
