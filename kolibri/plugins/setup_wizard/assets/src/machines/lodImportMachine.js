import { createMachine, assign } from 'xstate';
import SelectFacilityForm from '../views/importLODUsers/SelectFacilityForm.vue';
import ImportIndividualUserForm from '../views/importLODUsers/ImportIndividualUserForm.vue';
import SelectSuperAdminAccountForm from '../views/importFacility/SelectSuperAdminAccountForm';
import LoadingTaskPage from '../views/importLODUsers/LoadingTaskPage';

const assignDevice = assign((_, event) => {
  const data = event.value;
  const _device = {
    name: data.device_name,
    id: data.device_id,
    baseurl: data.device_address,
    facilities: [...data.facilities],
  };
  const _facility = { name: null, id: null, adminuser: null, adminpassword: null };
  if (_device.facilities.length === 1) {
    _facility.name = _device.facilities[0].name;
    _facility.id = _device.facilities[0].id;
  }
  const total_steps = _device.facilities.length === 1 ? 3 : 4;
  return {
    device: _device,
    facilities: _device.facilities,
    facility: _facility,
    steps: total_steps,
  };
});

const assignFacility = assign({
  facility: (_, event) => event.value,
});

const importUser = assign((context, event) => {
  const user = {
    username: event.value.username,
    password: event.value.password,
    full_name: event.value.full_name,
    task: event.value.task.id,
  };
  context.users.push(user);
  return {
    task: event.value.task,
  };
});

const registerUsers = assign((context, event) => {
  context.facility['adminUser'] = event.value.adminUsername;
  context.facility['adminPassword'] = event.value.adminPassword;
  return {
    users: event.value.users,
  };
});

export const lodImportMachine = createMachine({
  initial: 'selectFacility',
  context: {
    step: 1,
    steps: 4,
    device: { name: null, id: null, baseurl: null },
    facilities: [],
    facility: { name: null, id: null, adminUser: null, adminPassword: null },
    users: [],
    task: null,
  },
  states: {
    selectFacility: {
      meta: { step: '1', component: SelectFacilityForm },
      on: {
        CONTINUE: { target: 'userCredentials', actions: assignFacility },
        DEVICE_DATA: { actions: assignDevice },
      },
    },
    userCredentials: {
      meta: { step: '2', component: ImportIndividualUserForm },
      on: {
        CONTINUE: { target: 'importingUser', actions: importUser },
        CONTINUEADMIN: { target: 'adminCredentials', actions: registerUsers },
        BACK: 'selectFacility',
      },
    },
    importingUser: {
      meta: { step: '3', component: LoadingTaskPage },
      on: {
        BACK: 'userCredentials',
      },
    },
    adminCredentials: {
      meta: { step: '2', component: SelectSuperAdminAccountForm },
      on: {
        CONTINUE: { target: 'selectUsers' },
        BACK: 'userCredentials',
      },
    },
    selectUsers: {
      meta: { step: '3' },
      on: {
        CONTINUE: { target: 'importingUser' },
        BACK: 'adminCredentials',
      },
    },
    modalCoachAdmins: {},
  },
});
