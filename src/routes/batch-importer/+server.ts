import { json, type RequestHandler } from '@sveltejs/kit';
import { jsonError } from '$lib/utils';
import { PUBLIC_DATA_PROXY_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		const cuid = locals.user.cuid;

		// Validate the cuid
		if (!cuid) {
			return jsonError('Missing user ID', 400);
		}

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/user?user_id=${cuid}`);

		if (!response.ok) {
			return jsonError('Failed to fetch batches data', response.status);
		}

		const data = await response.json();

		return json({ data: data?.data });
	} catch (err) {
		console.error(`Error occurred while fetching data: ${err}`);
		return jsonError(
			'An error occurred while processing your request, please try again later',
			500
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return jsonError('Authentication required', 401);
	}

	const formData = await request.formData();
	const file = formData.get('file');
	const schemas = formData.get('schemas');
	const title = formData.get('title');
	const userId = locals.user?.cuid;

	formData.append('user_id', userId);
	formData.append('schemas', '[' + schemas + ']');

	if (!file || !schemas || !title) {
		return jsonError('Missing required fields', 400);
	}

	try {
		// Validate the batch import data
		const validationResponse = await validateBatchImport(formData);

		if (validationResponse.status !== 200) {
			return validationResponse;
		}

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/import`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			if (res.errors) {
				return json({ errors: res.errors }, { status: response.status });
			}
			const errorMessage = 'Failed to import batch';
			return jsonError(errorMessage, response.status);
		}

		const data = await response.json();
		return json({ data });
	} catch (err) {
		console.error(`Error occurred while importing batch: ${err}`);
		return jsonError(
			'An error occurred while processing your request, please try again later',
			500
		);
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return jsonError('Authentication required', 401);
	}

	const formData = await request.formData();
	const file = formData.get('file');
	const schemas = formData.get('schemas');
	const title = formData.get('title');
	const batchId = formData.get('batch_id');
	const userId = locals.user?.cuid;

	formData.append('user_id', userId);
	formData.append('schemas', '[' + schemas + ']');

	if (!file || !schemas || !title || !batchId) {
		return jsonError('Missing required fields', 400);
	}

	try {
		// Validate the batch import data
		const validationResponse = await validateBatchImport(formData);

		if (validationResponse.status !== 200) {
			return validationResponse;
		}

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/import`, {
			method: 'PUT',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			if (res.errors) {
				return json({ errors: res.errors }, { status: response.status });
			}
			const errorMessage = 'Failed to update batch';
			return jsonError(errorMessage, response.status);
		}

		const data = await response.json();
		return json({ data });
	} catch (err) {
		console.error(`Error occurred while updating batch: ${err}`);
		return jsonError(
			'An error occurred while processing your request, please try again later',
			500
		);
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return jsonError('Authentication required', 401);
	}

	const formData = await request.formData();
	const batchId = formData.get('batch_id');
	const userId = locals.user?.cuid;

	formData.append('user_id', userId);

	if (!batchId) {
		return jsonError('Missing batch_id', 400);
	}

	try {
		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/import`, {
			method: 'DELETE',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			return jsonError(res.message || 'Failed to delete batch', response.status);
		}

		return json({ message: 'Batch deleted successfully' });
	} catch (err) {
		console.error(`Error occurred while deleting batch: ${err}`);
		return jsonError(
			'An error occurred while processing your request, please try again later',
			500
		);
	}
};

const validateBatchImport = async (formData: FormData): Promise<Response> => {
	try {
		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/validate`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			if (res.errors) {
				return json({ errors: res.errors }, { status: response.status });
			}
			const errorMessage = 'Failed to validate batch';
			return jsonError(errorMessage, response.status);
		}

		const data = await response.json();
		return json({ data });
	} catch (err) {
		console.error(`Error occurred while validating batch: ${err}`);
		return jsonError(
			'An error occurred while processing your request, please try again later',
			500
		);
	}
};
