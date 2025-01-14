# JSONata Preset Functions for Resource-Based Extensions

## canI(resourceGroupAndVersion, resourceKind)

You can use the **canI** function to determine if a user has access rights for listing a specified resource. The function comes with the following parameters:

- **resourceGroupAndVersion** - the first part of a resource URL following the pattern: `${resource group}/${resource version}`.
- **resourceKind** - resource kind.

### Example

```yaml
- path: spec.gateway
  name: gateway
  visibility: $not($canI('networking.istio.io/v1beta1', 'Gateway'))
```

## compareStrings(first, second)

You can use this function to sort two strings alphabetically. The function comes with the following parameters:

- **first** - first string to compare.
- **second** - second string to compare.

### Example

Here is an example from the [ResourceList widget](./50-list-and-details-widgets.md#resourcelist):

```yaml
- widget: ResourceList
  source: '$myDeployments()'
  name: Example ResourceList Deployments
  sort:
    - source: '$item.spec.strategy.type'
      compareFunction: '$compareStrings($second, $first)'
      default: true
```

## matchByLabelSelector(item, selectorPath)

You can use this function to match Pods using a resource selector. The function comes with the following parameters:

- **item** - a Pod to be used.
- **selectorPath** - path to selector labels from `$root`.

### Example

Example from [dataSources](90-datasources.md).

```yaml
- podSelector:
    resource:
      kind: Pod
      version: v1
    filter: '$matchByLabelSelector($item, $root.spec.selector)'
```

## matchEvents(item, kind, name)

You can use this function to match Events using a resource selector. The function comes with the following parameters:

- **item** - an Event to be checked.
- **kind** - the kind of the Event emitting resource.
- **name** - the name of the Event emitting resource.

### Example

```yaml
- widget: EventList
  filter: '$matchEvents($item, $root.kind, $root.metadata.name)'
  name: events
  defaultType: NORMAL
  hideInvolvedObjects: true
```

## readableTimestamp(timestamp)

You can use this function to convert time to readable time. The function comes with the following parameters:

- **timestamp** - timestamp to convert.

### Example

```yaml
- source: '$readableTimestamp($item.lastTransitionTime)'
  name: status.conditions.lastTransitionTime
```