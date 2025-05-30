import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import jp from 'jsonpath';
import { MessageStrip } from '@ui5/webcomponents-react';
import { cloneDeep } from 'lodash';

import { ResourceForm } from 'shared/ResourceForm';

import { ItemArray } from 'shared/ResourceForm/fields';
import { useGetList } from 'shared/hooks/BackendAPI/useGet';

import {
  createBindingTemplate,
  newSubject,
  DEFAULT_APIGROUP,
} from './templates';
import { SingleSubjectForm } from './SubjectForm';
import { validateBinding } from './helpers';
import { RoleForm } from './RoleForm';
import { useHasPermissionsFor } from 'hooks/useHasPermissionsFor';

import { getDescription, SchemaContext } from 'shared/helpers/schema';

export function GenericRoleBindingCreate({
  formElementRef,
  namespace,
  onChange,
  setCustomValid,
  resource: initialRoleBinding,
  resourceUrl,
  pluralKind,
  singularName,
  ...props
}) {
  const { t } = useTranslation();
  const [hasPermissionsForClusterRoles] = useHasPermissionsFor([
    [DEFAULT_APIGROUP, 'clusterroles'],
  ]);
  const [binding, setBinding] = useState(
    cloneDeep(initialRoleBinding) || createBindingTemplate(namespace),
  );
  const [initialResource, setInitialResource] = useState(
    initialRoleBinding || createBindingTemplate(namespace),
  );

  useEffect(() => {
    cloneDeep(initialRoleBinding) || createBindingTemplate(namespace);
    setInitialResource(initialRoleBinding || createBindingTemplate(namespace));
  }, [initialRoleBinding, namespace]);

  useEffect(() => {
    setCustomValid(validateBinding(binding));
  }, [binding, setCustomValid]);

  const schema = useContext(SchemaContext);
  const subjectsDesc = getDescription(schema, 'subjects');

  const rolesUrl = `/apis/${DEFAULT_APIGROUP}/v1/namespaces/${namespace}/roles`;
  const {
    data: roles,
    loading: namespaceRolesLoading = true,
    error: namespaceRolesError,
  } = useGetList()(rolesUrl, { skip: !namespace });

  const clusterRolesUrl = `/apis/${DEFAULT_APIGROUP}/v1/clusterroles`;
  let {
    data: clusterRoles,
    loading: clusterRolesLoading = true,
    error: clusterRolesError,
  } = useGetList()(clusterRolesUrl, {
    skip: !hasPermissionsForClusterRoles,
  });

  // ignore no permissions for ClusterRoles
  if (clusterRolesError?.code === 403) {
    clusterRoles = [];
    clusterRolesError = null;
  }

  const rolesLoading =
    (!namespace ? false : namespaceRolesLoading) || clusterRolesLoading;
  const rolesError = namespaceRolesError || clusterRolesError;

  return (
    <ResourceForm
      {...props}
      pluralKind={pluralKind}
      singularName={singularName}
      resource={binding}
      setResource={setBinding}
      onChange={onChange}
      formElementRef={formElementRef}
      createUrl={resourceUrl}
      initialResource={initialResource}
      updateInitialResource={setInitialResource}
      nameProps={{ pattern: '.*', showHelp: false }}
      handleNameChange={name => {
        jp.value(binding, '$.metadata.name', name);

        setBinding({ ...binding });
      }}
    >
      <RoleForm
        loading={rolesLoading}
        error={rolesError}
        namespace={namespace}
        roles={roles}
        clusterRoles={clusterRoles}
        binding={binding}
        setBinding={setBinding}
      />
      {!jp.value(binding, '$.subjects.length') && (
        <MessageStrip
          design="Critical"
          hideCloseButton
          className="sap-margin-top-small"
        >
          {t('role-bindings.create-modal.at-least-one-subject-required', {
            resource: singularName,
          })}
        </MessageStrip>
      )}
      <ItemArray
        defaultOpen
        propertyPath="$.subjects"
        listTitle={t('role-bindings.create-modal.subjects')}
        nameSingular={t('role-bindings.create-modal.subject')}
        entryTitle={subject => subject?.name}
        tooltipContent={t(subjectsDesc)}
        atLeastOneRequiredMessage={t(
          'role-bindings.create-modal.at-least-one-subject-required',
          { resource: singularName },
        )}
        itemRenderer={({ item, values, setValues, index, nestingLevel }) => (
          <SingleSubjectForm
            subject={item}
            subjects={values}
            setSubjects={setValues}
            index={index}
            nestingLevel={nestingLevel}
          />
        )}
        newResourceTemplateFn={newSubject}
      />
    </ResourceForm>
  );
}
