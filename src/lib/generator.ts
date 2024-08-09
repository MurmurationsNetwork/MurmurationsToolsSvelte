import type { Field, Schema } from '$lib/types/schema';
import type { ProfileArray, ProfileObject } from '$lib/types/profile';

export function GenerateSchemaInstance(
	schema: Schema | null,
	data: Record<string, string>
): ProfileObject {
	if (!schema) {
		return {};
	}

	let profile: ProfileObject = {};
	const parsedData = parseArrayData(data);

	Object.keys(parsedData)
		.filter((fieldName) => parsedData[fieldName] !== '')
		.forEach((fieldName) => {
			if (fieldName === 'linked_schemas') {
				const schemaParsedData = parsedData[fieldName] as string;
				profile[fieldName] = schemaParsedData.split(',').map((s: string) => s.trim());
			} else if (fieldName.includes('[') || fieldName.includes('.')) {
				profile = parseArrayObject(fieldName, parsedData[fieldName], schema, profile);
			} else {
				if (schema?.properties[fieldName]?.type === 'number') {
					profile[fieldName] = parseFloat(parsedData[fieldName] as string);
				} else {
					profile[fieldName] = parsedData[fieldName];
				}
			}
		});
	return profile;
}

function parseArrayObject(
	fieldName: string,
	fieldData: string | string[] | number,
	schema: Schema | Field | null,
	profile: ProfileObject
): ProfileObject {
	const props = fieldName.split('.');
	let curr: ProfileObject = profile;
	let currSchema: Schema | Field | null = schema;

	if (currSchema && currSchema.type === 'number') {
		fieldData = parseFloat(fieldData as string);
	}

	for (let i = 0; i < props.length; i++) {
		const prop = props[i];
		const matches = prop.match(/(.+)\[(\d+)]/);

		if (matches) {
			const name = matches[1];
			const index = parseInt(matches[2]);

			if (!curr[name]) {
				curr[name] = [];
			}

			if (!(curr[name] as ProfileArray)[index]) {
				(curr[name] as ProfileArray)[index] = {};
			}

			if (i === props.length - 1) {
				(curr[name] as ProfileArray)[index] = fieldData;
			} else {
				curr = (curr[name] as ProfileArray)[index] as ProfileObject;
				if (currSchema?.properties) {
					currSchema = currSchema?.properties[name]?.items || null;
				}
			}
		} else {
			if (!curr[prop]) {
				curr[prop] = {};
			}

			if (i === props.length - 1) {
				if (
					currSchema &&
					currSchema.properties &&
					Object.prototype.hasOwnProperty.call(currSchema.properties, prop)
				) {
					curr[prop] = fieldData;
				}
			} else {
				curr = curr[prop] as ProfileObject;
				if (currSchema?.properties) {
					currSchema = currSchema?.properties[prop];
				}
			}
		}
	}

	return profile;
}

function parseArrayData(
	data: Record<string, string | string[]>
): Record<string, string | string[]> {
	// Deal with multiple values submitted as an array
	for (const key in data) {
		if (key.endsWith('[]')) {
			const keyWithoutBrackets = key.slice(0, -2);

			if (data[key].length === 1) {
				data[keyWithoutBrackets] = [];
				data[keyWithoutBrackets].push(...data[key]);
			} else {
				data[keyWithoutBrackets] = data[key];
			}

			delete data[key];
		} else {
			if (data[key].length === 1) {
				data[key] = data[key][0];
			}
		}
	}
	return data;
}
