import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckBox,
  List,
  ListItemStandard,
  MessageStrip,
  Text,
} from '@ui5/webcomponents-react';
import {
  checkIfAssociatedResourceLeft,
  deleteAssociatedResources,
  deleteCrResources,
  fetchResourceCounts,
  generateAssociatedResourcesUrls,
  getAssociatedResources,
  getCommunityResourceUrls,
  getCommunityResources,
  getCRResource,
  handleItemClick,
} from '../deleteModulesHelpers';
import { useNavigate } from 'react-router';
import { useGetScope, useSingleGet } from 'shared/hooks/BackendAPI/useGet';
import { useUrl } from 'hooks/useUrl';
import pluralize from 'pluralize';
import { useDelete } from 'shared/hooks/BackendAPI/useMutation';
import { cloneDeep } from 'lodash';
import { KymaResourceType, ModuleTemplateListType } from '../support';
import { SetterOrUpdater } from 'recoil';
import { ColumnLayoutState } from 'state/columnLayoutAtom';
import { usePost } from 'shared/hooks/BackendAPI/usePost';
import { useRecoilValue } from 'recoil';
import { allNodesSelector } from 'state/navigation/allNodesSelector';

type ModulesListDeleteBoxProps = {
  DeleteMessageBox: React.FC<any>;
  moduleTemplates: ModuleTemplateListType;
  selectedModules: { name: string }[];
  chosenModuleIndex: number | null;
  kymaResource: KymaResourceType;
  kymaResourceState?: KymaResourceType;
  detailsOpen: boolean;
  isCommunity?: boolean;
  setLayoutColumn: SetterOrUpdater<ColumnLayoutState>;
  handleModuleUninstall: () => void;
  setChosenModuleIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setInitialUnchangedResource: React.Dispatch<React.SetStateAction<any>>;
  setKymaResourceState: React.Dispatch<React.SetStateAction<any>>;
};

export const ModulesDeleteBox = ({
  DeleteMessageBox,
  moduleTemplates,
  selectedModules,
  chosenModuleIndex,
  kymaResource,
  kymaResourceState,
  detailsOpen,
  isCommunity,
  setLayoutColumn,
  handleModuleUninstall,
  setChosenModuleIndex,
  setKymaResourceState,
  setInitialUnchangedResource,
}: ModulesListDeleteBoxProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getScope = useGetScope();
  const { clusterUrl, namespaceUrl } = useUrl();
  const deleteResourceMutation = useDelete();
  const fetchFn = useSingleGet();
  const post = usePost();
  const clusterNodes = useRecoilValue(allNodesSelector).filter(
    node => !node.namespaced,
  );
  const namespaceNodes = useRecoilValue(allNodesSelector).filter(
    node => node.namespaced,
  );
  const [resourceCounts, setResourceCounts] = useState<Record<string, any>>({});
  const [forceDeleteUrls, setForceDeleteUrls] = useState<string[]>([]);
  const [crUrls, setCrUrls] = useState<string[]>([]);
  const [communityResourcesUrls, setCommunityResourcesUrls] = useState<
    string[]
  >([]);
  const [allowForceDelete, setAllowForceDelete] = useState(false);
  const [associatedResourceLeft, setAssociatedResourceLeft] = useState(false);

  const associatedResources = useMemo(
    () =>
      getAssociatedResources(
        chosenModuleIndex,
        selectedModules,
        kymaResource,
        moduleTemplates,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chosenModuleIndex, moduleTemplates],
  );

  useEffect(() => {
    const fetchCounts = async () => {
      const counts = await fetchResourceCounts(associatedResources, fetchFn);

      const urls = await generateAssociatedResourcesUrls(
        associatedResources,
        fetchFn,
        clusterUrl,
        getScope,
        namespaceUrl,
        navigate,
      );

      const crUResources = getCRResource(
        chosenModuleIndex,
        selectedModules,
        kymaResource,
        moduleTemplates,
        isCommunity,
      );

      const crUrl = isCommunity
        ? await getCommunityResourceUrls(
            crUResources,
            clusterNodes,
            namespaceNodes,
            fetchFn,
          )
        : await generateAssociatedResourcesUrls(
            crUResources,
            fetchFn,
            clusterUrl,
            getScope,
            namespaceUrl,
            navigate,
          );

      if (isCommunity) {
        const communityResources = await getCommunityResources(
          chosenModuleIndex,
          selectedModules,
          kymaResource,
          moduleTemplates,
          post,
        );
        const communityUrls = await getCommunityResourceUrls(
          communityResources,
          clusterNodes,
          namespaceNodes,
          fetchFn,
        );
        setCommunityResourcesUrls(communityUrls);
      }

      setResourceCounts(counts);
      setForceDeleteUrls(urls);
      setCrUrls(Array.isArray(crUrl) ? crUrl : [crUrl]);
    };

    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associatedResources]);

  useEffect(() => {
    const resourcesLeft = checkIfAssociatedResourceLeft(
      resourceCounts,
      associatedResources,
    );

    setAssociatedResourceLeft(resourcesLeft);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceCounts, associatedResources]);

  const deleteAllResources = () => {
    if (allowForceDelete && forceDeleteUrls.length > 0) {
      deleteAssociatedResources(deleteResourceMutation, forceDeleteUrls);
    }
    if (chosenModuleIndex != null) {
      selectedModules.splice(chosenModuleIndex, 1);
    }
    if (!isCommunity && kymaResource) {
      setKymaResourceState({
        ...kymaResource,
        spec: {
          ...kymaResource.spec,
          modules: selectedModules,
        },
      });
      handleModuleUninstall();
      setInitialUnchangedResource(cloneDeep(kymaResourceState));
    }

    if (detailsOpen) {
      setLayoutColumn({
        layout: 'OneColumn',
        startColumn: null,
        midColumn: null,
        endColumn: null,
      });
    }
    if (allowForceDelete && forceDeleteUrls.length > 0) {
      deleteCrResources(deleteResourceMutation, crUrls);
    }
  };

  const deleteCommunityResources = async () => {
    if (allowForceDelete && forceDeleteUrls.length) {
      // Delete associated resources.
      await deleteAssociatedResources(deleteResourceMutation, forceDeleteUrls);
    }
    if ((allowForceDelete || !associatedResourceLeft) && crUrls?.length) {
      // Delete spec.data.
      await deleteCrResources(deleteResourceMutation, crUrls);
    }
    if (
      (allowForceDelete || !associatedResourceLeft) &&
      communityResourcesUrls?.length
    ) {
      // Delete community resources.
      await deleteCrResources(deleteResourceMutation, communityResourcesUrls);
    }
    if (detailsOpen) {
      setLayoutColumn({
        layout: 'OneColumn',
        startColumn: null,
        midColumn: null,
        endColumn: null,
      });
    }
  };

  return (
    <DeleteMessageBox
      disableDeleteButton={associatedResourceLeft ? !allowForceDelete : false}
      customDeleteText={
        associatedResourceLeft && allowForceDelete
          ? 'common.buttons.cascade-delete'
          : null
      }
      cancelFn={() => {
        setAllowForceDelete(false);
        setChosenModuleIndex(null);
      }}
      additionalDeleteInfo={
        <>
          <Text>
            {t('kyma-modules.delete-module', {
              name:
                chosenModuleIndex != null
                  ? selectedModules[chosenModuleIndex]?.name
                  : '',
            })}
          </Text>
          {associatedResources.length > 0 && (
            <>
              <MessageStrip
                design="Information"
                hideCloseButton
                className="sap-margin-top-small"
              >
                {t('kyma-modules.associated-resources-warning')}
              </MessageStrip>
              <List
                headerText={t('kyma-modules.associated-resources')}
                selectionMode="None"
                separators="All"
              >
                {associatedResources.map(
                  (associatedResource: {
                    kind: string;
                    group: string;
                    version: string;
                  }) => {
                    const key = `${associatedResource.kind}-${associatedResource.group}-${associatedResource.version}`;
                    const resourceCount = resourceCounts[key];
                    return (
                      <ListItemStandard
                        onClick={e => {
                          e.preventDefault();
                          handleItemClick(
                            associatedResource.kind,
                            associatedResource.group,
                            associatedResource.version,
                            clusterUrl,
                            getScope,
                            namespaceUrl,
                            navigate,
                          );
                        }}
                        type="Active"
                        key={key}
                        additionalText={
                          (resourceCount === 0 ? '0' : resourceCount) ||
                          t('common.headers.loading')
                        }
                      >
                        {pluralize(associatedResource?.kind)}
                      </ListItemStandard>
                    );
                  },
                )}
              </List>
              {associatedResourceLeft && (
                <CheckBox
                  checked={allowForceDelete}
                  onChange={() => setAllowForceDelete(!allowForceDelete)}
                  accessibleName={t('kyma-modules.cascade-delete')}
                  text={t('kyma-modules.cascade-delete')}
                  className="sap-margin-top-tiny"
                />
              )}

              {associatedResourceLeft && allowForceDelete && (
                <MessageStrip
                  design="Critical"
                  hideCloseButton
                  className="sap-margin-y-small"
                >
                  {t('kyma-modules.cascade-delete-warning')}
                </MessageStrip>
              )}
            </>
          )}
        </>
      }
      resourceTitle={
        chosenModuleIndex != null
          ? selectedModules[chosenModuleIndex]?.name
          : ''
      }
      deleteFn={() => {
        if (!isCommunity && kymaResource) {
          deleteAllResources();
        } else if (isCommunity) {
          deleteCommunityResources();
        }
      }}
    />
  );
};
