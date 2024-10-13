export type ProfileValue = string | number | boolean | ProfileArray | ProfileObject;
export type ProfileArray = Array<ProfileValue>;

export interface ProfileObject {
	[key: string]: ProfileValue;
}
