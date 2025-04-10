import { Button, FlexBox, RadioButton, Title } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import './ClusterPreview.scss';
import {
  findInitialValue,
  findInitialValues,
} from '../views/EditCluster/EditCluster';
import { getUserIndex } from '../shared';
import { Tokens } from 'shared/components/Tokens';

export function ClusterPreview({ kubeconfig, storage, setSelected, hasAuth }) {
  const { t } = useTranslation();
  const userIndex = getUserIndex(kubeconfig);
  const authenticationType = kubeconfig?.users?.[userIndex]?.user?.exec
    ? 'oidc'
    : 'token';

  const OidcData = () => {
    const issuerUrl = findInitialValue(
      kubeconfig,
      'oidc-issuer-url',
      userIndex,
    );
    const clientId = findInitialValue(kubeconfig, 'oidc-client-id', userIndex);
    const clientSecret = findInitialValue(
      kubeconfig,
      'oidc-client-secret',
      userIndex,
    );
    const extraScopes = findInitialValues(
      kubeconfig,
      'oidc-extra-scope',
      userIndex,
    );

    return (
      <>
        {issuerUrl && (
          <>
            <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
              {t('clusters.labels.issuer-url')}:
            </p>
            <div>{issuerUrl}</div>
          </>
        )}
        {clientId && (
          <>
            <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
              {t('clusters.labels.client-id')}:
            </p>
            <div>{clientId}</div>
          </>
        )}
        {clientSecret && (
          <>
            <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
              {t('clusters.labels.client-secret')}:
            </p>
            <div>{clientSecret}</div>
          </>
        )}
        {extraScopes && (
          <>
            <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
              {t('clusters.labels.scopes')}:
            </p>
            {<Tokens tokens={extraScopes} />}
          </>
        )}
      </>
    );
  };

  const TokenData = () => {
    const token = kubeconfig?.users?.[userIndex]?.user?.token;
    return (
      <>
        <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
          {`${t('clusters.token')}:`}
        </p>
        {token && <div className="cluster-preview__token">{token}</div>}
      </>
    );
  };

  return (
    <div className="cluster-preview">
      <div className="add-cluster__content-container">
        <Title level="H5" className="sap-margin-bottom-medium">
          {t('clusters.wizard.review')}
        </Title>
        <Title
          level="H5"
          className="cluster-preview__subtitle sap-margin-y-small"
        >{`1. ${t('common.headers.configuration')}`}</Title>
        <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
          {t('clusters.name_singular')}:
        </p>
        <div className="cluster-preview__content sap-margin-top-small sap-margin-bottom-tiny">
          <div>{kubeconfig?.['current-context']}</div>
          <Button
            design="Transparent"
            onClick={() => setSelected(1)}
            className="cluster-preview__edit-button"
          >
            {t('common.buttons.edit')}
          </Button>
        </div>
        <Title
          level="H5"
          className="cluster-preview__subtitle sap-margin-y-small"
        >{`2. ${t('clusters.wizard.authentication')}`}</Title>

        <div className="cluster-preview__content sap-margin-top-small sap-margin-bottom-tiny">
          <div className="cluster-preview__auth">
            {authenticationType === 'token' ? <TokenData /> : <OidcData />}
          </div>
          <Button
            design="Transparent"
            onClick={() => (hasAuth ? setSelected(1) : setSelected(2))}
            className="cluster-preview__edit-button"
          >
            {t('common.buttons.edit')}
          </Button>
        </div>
        <Title
          level="H5"
          className="cluster-preview__subtitle sap-margin-y-small"
        >{`3. ${t('clusters.wizard.storage')}`}</Title>
        <p className="cluster-preview__data-header sap-margin-top-small sap-margin-bottom-tiny">
          {`${t('clusters.storage.storage-preference')}:`}
        </p>
        <div className="cluster-preview__content sap-margin-bottom-medium sap-margin-top-tiny">
          <FlexBox
            direction="Column"
            className="cluster-preview__storage-container"
          >
            <RadioButton
              checked={storage === 'localStorage'}
              text={`${t('clusters.storage.labels.localStorage')}: ${t(
                'clusters.storage.descriptions.localStorage',
              )}`}
              disabled
              className="cluster-preview__storage"
            />
            <RadioButton
              checked={storage === 'sessionStorage'}
              text={`${t('clusters.storage.labels.sessionStorage')}: ${t(
                'clusters.storage.descriptions.sessionStorage',
              )}`}
              disabled
              className="cluster-preview__storage"
            />
            <RadioButton
              checked={storage === 'inMemory'}
              text={`${t('clusters.storage.labels.inMemory')}: ${t(
                'clusters.storage.descriptions.inMemory',
              )}`}
              disabled
              className="cluster-preview__storage"
            />
          </FlexBox>
          <Button
            design="Transparent"
            onClick={() => {
              hasAuth ? setSelected(2) : setSelected(3);
            }}
            className="cluster-preview__edit-button"
          >
            {t('common.buttons.edit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
