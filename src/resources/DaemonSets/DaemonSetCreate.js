import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';

import { ResourceForm } from 'shared/ResourceForm';
import { activeNamespaceIdState } from 'state/activeNamespaceIdAtom';
import * as _ from 'lodash';

import { createDaemonSetTemplate } from './templates';

export default function DaemonSetCreate({
  formElementRef,
  onChange,
  setCustomValid,
  resourceUrl,
  resource: initialDaemonSet,
  ...props
}) {
  const { t } = useTranslation();

  const namespaceId = useRecoilValue(activeNamespaceIdState);
  const [daemonSet, setDaemonSet] = useState(
    _.cloneDeep(initialDaemonSet) || createDaemonSetTemplate(namespaceId),
  );
  const [initialResource, setInitialResource] = useState(
    initialDaemonSet || createDaemonSetTemplate(namespaceId),
  );

  useEffect(() => {
    setDaemonSet(
      _.cloneDeep(initialDaemonSet) || createDaemonSetTemplate(namespaceId),
    );
    setInitialResource(
      initialDaemonSet || createDaemonSetTemplate(namespaceId),
    );
  }, [initialDaemonSet, namespaceId]);

  return (
    <ResourceForm
      {...props}
      pluralKind="daemonsets"
      singularName={t('daemon-sets.name_singular')}
      resource={daemonSet}
      initialResource={initialResource}
      updateInitialResource={setInitialResource}
      setResource={setDaemonSet}
      onChange={onChange}
      formElementRef={formElementRef}
      createUrl={resourceUrl}
      setCustomValid={setCustomValid}
      onlyYaml
    />
  );
}
