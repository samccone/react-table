import React from 'react'

import { useGetLatest, getFirstDefined } from '../utils'

export const withVisibility = {
  name: 'withVisibility',
  after: ['withCore'],
  useReduceOptions,
  useInstanceAfterState,
  useInstanceAfterDataModel,
  decorateColumn,
}

function useReduceOptions(options) {
  return {
    ...options,
    initialState: {
      columnVisibility: {},
      ...options.initialState,
    },
  }
}

function useInstanceAfterState(instance) {
  const { setState } = instance

  const getInstance = useGetLatest(instance)

  instance.toggleColumnVisibility = React.useCallback(
    (columnId, value) => {
      value = getFirstDefined(
        value,
        !getInstance().getColumnIsVisible(columnId)
      )

      if (getInstance().getColumnCanHide(columnId)) {
        setState(
          old => ({
            ...old,
            columnVisibility: {
              ...old.columnVisibility,
              [columnId]: value,
            },
          }),
          {
            type: 'toggleColumnVisibility',
            value,
          }
        )
      }
    },
    [getInstance, setState]
  )

  instance.toggleAllColumnsVisible = React.useCallback(
    value => {
      value = getFirstDefined(value, !getInstance().getIsAllColumnsVisible())

      setState(
        old => ({
          ...old,
          columnVisibility: getInstance().leafColumns.reduce(
            (obj, column) => ({
              ...obj,
              [column.id]: !value
                ? !getInstance().getColumnCanHide(column.id)
                : value,
            }),
            {}
          ),
        }),
        {
          type: 'toggleAllColumnsVisible',
          value,
        }
      )
    },
    [getInstance, setState]
  )

  instance.getColumnIsVisible = React.useCallback(
    columnId => {
      const column = getInstance().leafColumns.find(d => d.id === columnId)

      if (!column) {
        return true
      }

      return getFirstDefined(
        instance.state.columnVisibility[columnId],
        column.defaultIsVisible,
        true
      )
    },
    [getInstance, instance.state.columnVisibility]
  )

  instance.getColumnCanHide = React.useCallback(
    columnId => {
      const column = getInstance().leafColumns.find(d => d.id === columnId)

      if (!column) {
        return false
      }

      return getFirstDefined(
        getInstance().options.disabledHiding ? false : undefined,
        column.disableHiding ? false : undefined,
        column.defaultCanHide,
        true
      )
    },
    [getInstance]
  )
}

function useInstanceAfterDataModel(instance) {
  const getInstance = useGetLatest(instance)

  instance.getToggleAllColumnsVisibilityProps = React.useCallback(
    (props = {}) => {
      return {
        onChange: e => {
          getInstance().toggleAllColumnsVisible(e.target.checked)
        },
        title: 'Toggle visibility for all columns',
        checked: getInstance().getIsAllColumnsVisible(),
        indeterminate:
          !getInstance().getIsAllColumnsVisible() &&
          getInstance().getIsSomeColumnsVisible(),
        ...props,
      }
    },
    [getInstance]
  )
}

function decorateColumn(column, { getInstance }) {
  column.getCanHide = () => getInstance().getColumnCanHide(column.id)
  column.getIsVisible = () => getInstance().getColumnIsVisible(column.id)
  column.toggleVisibility = value =>
    getInstance().toggleColumnVisibility(column.id, value)

  column.getToggleVisibilityProps = (props = {}) => ({
    type: 'checkbox',
    onChange: e => {
      column.toggleVisibility(e.target.checked)
    },
    checked: column.getIsVisible(),
    title: 'Toggle Column Visible',
    ...props,
  })
}
