import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import * as Inputs from 'shared/ResourceForm/inputs';
import { useUpsert } from 'shared/hooks/BackendAPI/useUpsert';
import { useNotification } from 'shared/contexts/NotificationContext';
import { ResourceForm } from 'shared/ResourceForm';
import { useGetList } from 'shared/hooks/BackendAPI/useGet';

import { createConfigmap, createExtensibilityTemplate } from './helpers';
import { ColumnsInput } from './ColumnsInput';
import './ExtensibilityStarterForm.scss';
import { clusterState } from 'state/clusterAtom';
import { usePrepareLayout } from 'shared/hooks/usePrepareLayout';
import { columnLayoutState } from 'state/columnLayoutAtom';
import { useNavigate } from 'react-router';

export default function BusolaExtensionCreate({
  formElementRef,
  onChange,
  layoutNumber,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notificationManager = useNotification();
  const upsert = useUpsert();
  const cluster = useRecoilValue(clusterState);
  const setLayoutColumn = useSetRecoilState(columnLayoutState);

  const { nextQuery, nextLayout } = usePrepareLayout(layoutNumber);

  const { data: crds } = useGetList()(
    '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
  );
  const [crd, setCrd] = useState(null);
  const [state, setState] = useState({});

  return (
    <div className="extension-create-container">
      <ResourceForm.Single
        formElementRef={formElementRef}
        onChange={onChange}
        resource={state}
        initialResource={{}}
        setResource={setState}
        className="resource-form--unset-height"
        createResource={async () => {
          const onError = e =>
            notificationManager.notifyError({
              content: t('common.messages.error', { error: e.message }),
              title: t('extensibility.starter-modal.messages.error'),
              type: 'error',
            });

          const onSuccess = () => {
            notificationManager.notifySuccess({
              content: t('extensibility.starter-modal.messages.success'),
            });

            setLayoutColumn({
              layout: nextLayout,
              showCreate: null,
              startColumn: {
                resourceName: null,
                resourceType: 'Extensions',
                rawResourceTypeName: 'ConfigMap',
                namespaceId: 'kube-public',
              },
              midColumn: {
                resourceName: crd?.metadata?.name,
                resourceType: 'Extensions',
                rawResourceTypeName: 'ConfigMap',
                namespaceId: 'kube-public',
              },
              endColumn: null,
            });
            navigate(
              `/cluster/${cluster.contextName}/busolaextensions/kube-public/${crd.metadata.name}${nextQuery}`,
            );
          };

          const configmap = createConfigmap(crd, state);
          await upsert({
            url: '/api/v1/namespaces/kube-public/configmaps',
            resource: configmap,
            onSuccess,
            onError,
          });
        }}
      >
        <ResourceForm.FormField
          updatesOnInput={false}
          required
          label={t('extensibility.starter-modal.crd')}
          value={crd?.metadata.name}
          setValue={value => {
            const crd = crds.find(crd => crd.metadata.name === value);
            if (crd) {
              setCrd(crd);
              setState(createExtensibilityTemplate(crd, t));
            }
          }}
          input={Inputs.ComboboxInput}
          options={(crds ?? []).map(crd => ({
            key: crd.metadata.name,
            text: crd.metadata.name,
          }))}
        />
        {crd && (
          <>
            <ResourceForm.FormField
              required
              propertyPath="$.general.name"
              label={t('common.labels.name')}
              input={Inputs.Text}
            />
            <ResourceForm.FormField
              required
              propertyPath="$.general.category"
              label={t('common.labels.category')}
              input={Inputs.Text}
            />
            <ResourceForm.CollapsibleSection
              title={t('extensibility.starter-modal.headers.form-fields')}
            >
              <ColumnsInput propertyPath="$.form" />
            </ResourceForm.CollapsibleSection>
            <ResourceForm.CollapsibleSection
              title={t('extensibility.starter-modal.headers.list-columns')}
            >
              <ColumnsInput propertyPath="$.list" />
            </ResourceForm.CollapsibleSection>
            <ResourceForm.CollapsibleSection
              title={t('extensibility.starter-modal.headers.details-summary')}
            >
              <ColumnsInput propertyPath="$.details.body[0].children" />
            </ResourceForm.CollapsibleSection>
          </>
        )}
      </ResourceForm.Single>
    </div>
  );
}
