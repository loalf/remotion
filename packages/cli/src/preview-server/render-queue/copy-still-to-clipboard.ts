import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';

const findClosestPackageJson = (): string | null => {
	const recursionLimit = 5;
	let currentDir = __dirname;
	let possiblePackageJson = '';
	for (let i = 0; i < recursionLimit; i++) {
		possiblePackageJson = path.join(currentDir, 'package.json');
		const exists = fs.existsSync(possiblePackageJson);
		if (exists) {
			return possiblePackageJson;
		}

		currentDir = path.dirname(currentDir);
	}

	return null;
};

const deriveBinaryPath = (binary: string) => {
	const closestPackageJson = findClosestPackageJson() as string;
	return path.resolve(closestPackageJson, `../${binary}`);
};

const isWayland = () => process.env.XDG_SESSION_TYPE === 'wayland';

const run = (cmd: string) => {
	return new Promise<void>((resolve, reject) => {
		exec(cmd, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
};

const copyX11 = (file: string) =>
	run(`xclip -sel clip -t image/png -i "${file}"`);

const copyWayland = (file: string) => run(`wl-copy < "${file}"`);

const copyLinux = (file: string) =>
	isWayland() ? copyWayland(file) : copyX11(file);

const copyOsx = (file: string) => {
	const binaryPath = deriveBinaryPath('osx-copy-image');
	exec(`chmod +x "${binaryPath}"`);
	return run(`${binaryPath} "${file}"`);
};

const copyWindows = (file: string) => {
	const binaryPath = deriveBinaryPath('file2clip.exe');
	return run(
		`powershell.exe -ExecutionPolicy Bypass Start-Process -NoNewWindow -FilePath ${binaryPath} -ArgumentList "${file}"`
	);
};

export const copyStillToClipBoard = (img: string): Promise<void> => {
	const file = process.cwd() + '/' + img;

	return process.platform === 'win32'
		? copyWindows(file)
		: process.platform === 'darwin'
		? copyOsx(file)
		: copyLinux(file);
};
