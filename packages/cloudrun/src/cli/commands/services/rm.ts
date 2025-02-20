import {CliInternals} from '@remotion/cli';
import {deleteService} from '../../../api/delete-service';
import {getServiceInfo} from '../../../api/get-service-info';
import {BINARY_NAME} from '../../../shared/constants';
import {getGcpRegion} from '../../get-gcp-region';
import {confirmCli} from '../../helpers/confirm';
import {quit} from '../../helpers/quit';
import {Log} from '../../log';
import {displayServiceInfo, SERVICES_COMMAND} from './index';
import {SERVICES_LS_SUBCOMMAND} from './ls';

export const SERVICES_RM_SUBCOMMAND = 'rm';

export const servicesRmCommand = async (args: string[]) => {
	if (args.length === 0) {
		Log.error('No service name passed.');
		Log.error(
			'Pass another argument which is the name of the service you would like to remove.',
		);
		Log.info(
			`You can run \`${BINARY_NAME} ${SERVICES_COMMAND} ${SERVICES_LS_SUBCOMMAND}\` to see a list of deployed Cloud Run services.`,
		);
		quit(1);
	}

	if (args[0] === '()') {
		Log.info('No services to remove.');
		return;
	}

	const region = getGcpRegion();

	for (const serviceName of args) {
		const infoOutput = CliInternals.createOverwriteableCliOutput({
			quiet: CliInternals.quietFlagProvided(),
			cancelSignal: null,
			updatesDontOverwrite: false,
			indent: false,
		});
		infoOutput.update('Getting service info...', false);
		const info = await getServiceInfo({
			region,
			serviceName,
		});

		infoOutput.update(displayServiceInfo(info), false);
		Log.info();

		const confirmDelete = await confirmCli({
			delMessage: 'Delete? (Y/n)',
			allowForceFlag: true,
		});

		if (!confirmDelete) {
			Log.info(`Skipping service - ${info.serviceName}.`);
			continue;
		}

		const output = CliInternals.createOverwriteableCliOutput({
			quiet: CliInternals.quietFlagProvided(),
			cancelSignal: null,
			updatesDontOverwrite: false,
			indent: false,
		});
		output.update('Deleting...', false);
		await deleteService({
			serviceName,
			region,
		});
		output.update('Deleted!\n', false);
	}
};
