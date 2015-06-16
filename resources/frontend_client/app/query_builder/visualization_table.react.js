'use strict';

import FixedDataTable from 'fixed-data-table';
import Icon from './icon.react';

var cx = React.addons.classSet;
var Table = FixedDataTable.Table;
var Column = FixedDataTable.Column;

export default React.createClass({
    displayName: 'QueryVisualizationTable',
    propTypes: {
        data: React.PropTypes.object,
        sort: React.PropTypes.array
    },

    // local variables
    isColumnResizing: false,

    // React lifecycle
    getDefaultProps: function() {
        return {
            maxRows: 2000,
            minColumnWidth: 75
        };
    },

    getInitialState: function() {
        return {
            width: 0,
            height: 0,
            columnWidths: [],
            colDefs: null
        };
    },

    componentWillMount: function() {
        if (this.props.data) {
            this.setState({
                colDefs: JSON.stringify(this.props.data.cols)
            });
        }
    },

    componentWillReceiveProps: function(newProps) {
        // TODO: check if our data has changed and specifically if our columns list has changed
        if (JSON.stringify(newProps.data.cols) !== this.state.colDefs) {
            // if the columns have changed then reset any column widths we have setup
            this.setState({
                colDefs: JSON.stringify(this.props.data.cols),
                columnWidths: this.calculateColumnWidths(this.state.width, this.props.minColumnWidth, newProps.data.cols)
            });
        }
    },

    componentDidMount: function() {
        this.calculateSizing(this.getInitialState());
    },

    componentDidUpdate: function(prevProps, prevState) {
        this.calculateSizing(prevState);
    },

    // availableWidth, minColumnWidth, # of columns
    // previousWidths, prevWidth
    calculateColumnWidths: function(availableWidth, minColumnWidth, colDefs, prevAvailableWidth, prevColumnWidths) {
        // TODO: maintain column spacing on a window resize

        var calcColumnWidth = (colDefs.length > 0) ? availableWidth / colDefs.length : minColumnWidth;
        var columnWidths = colDefs.map(function (column, idx) {
            return (minColumnWidth > calcColumnWidth) ? minColumnWidth : calcColumnWidth;
        });

        return columnWidths;
    },

    calculateSizing: function(prevState) {
        var element = this.getDOMNode(); //React.findDOMNode(this);

        // account for padding above our parent
        var style = window.getComputedStyle(element.parentElement, null);
        var paddingTop = Math.ceil(parseFloat(style.getPropertyValue("padding-top")));

        var width = element.parentElement.offsetWidth;
        var height = element.parentElement.offsetHeight - paddingTop;

        if (width !== prevState.width || height !== prevState.height) {
            var updatedState = {
                width: width,
                height: height
            };

            if (width !== prevState.width) {
                var tableColumnWidths = this.calculateColumnWidths(width, this.props.minColumnWidth, this.props.data.cols, prevState.width, prevState.columnWidths);
                updatedState.columnWidths = tableColumnWidths;
            }

            this.setState(updatedState);
        }
    },

    isSortable: function() {
        return (this.props.setSortFn !== undefined);
    },

    setSort: function(fieldId) {
        this.props.setSortFn(fieldId);
    },

    rowGetter: function(rowIndex) {
        return this.props.data.rows[rowIndex];
    },

    cellDataGetter: function(cellKey, row) {
        // TODO: should we be casting all values toString()?
        return (row[cellKey] !== null) ? row[cellKey].toString() : null;
    },

    columnResized: function(width, idx) {
        var tableColumnWidths = this.state.columnWidths;
        tableColumnWidths[idx] = width;
        this.setState({
            columnWidths: tableColumnWidths
        });
        this.isColumnResizing = false;
    },

    tableHeaderRenderer: function(columnIndex) {
        var column = this.props.data.cols[columnIndex],
            colVal = (column !== null) ? column.name.toString() : null;

        var headerClasses = cx({
            'MB-DataTable-header' : true,
            'flex': true,
            'align-center': true,
            'MB-DataTable-header--sorted': (this.props.sort && (this.props.sort[0][0] === column.id)),
        });

        // set the initial state of the sorting indicator chevron
        var sortChevron = (<Icon name="chevrondown" width="8px" height="8px"></Icon>);

        if(this.props.sort && this.props.sort[0][1] === 'ascending') {
            sortChevron = (<Icon name="chevronup" width="8px" height="8px"></Icon>);
        }

        if (this.isSortable()) {
            // ICK.  this is hacky for dealing with aggregations.  need something better
            var fieldId = (column.id) ? column.id : "agg";

            return (
                <div key={columnIndex} className={headerClasses} onClick={this.setSort.bind(null, fieldId)}>
                    {colVal}
                    <span className="ml1">
                        {sortChevron}
                    </span>
                </div>
            );
        } else {
            return (<div className={headerClasses}>{colVal}</div>);
        }
    },

    render: function() {
        if(!this.props.data) {
            return false;
        }

        var component = this;
        var tableColumns = this.props.data.cols.map(function (column, idx) {
            var colVal = (column !== null) ? column.name.toString() : null;
            var colWidth = component.state.columnWidths[idx];

            if (!colWidth) {
                colWidth = 75;
            }

            return (
                <Column
                    key={'col_' + idx}
                    className="MB-DataTable-column"
                    width={colWidth}
                    isResizable={true}
                    headerRenderer={component.tableHeaderRenderer.bind(null, idx)}
                    cellDataGetter={component.cellDataGetter}
                    dataKey={idx}
                    label={colVal}>
                </Column>
            );
        });

        return (
            <Table
                className="MB-DataTable"
                rowHeight={35}
                rowGetter={this.rowGetter}
                rowsCount={this.props.data.rows.length}
                width={this.state.width}
                height={this.state.height}
                headerHeight={50}
                isColumnResizing={this.isColumnResizing}
                onColumnResizeEndCallback={component.columnResized}>
                {tableColumns}
            </Table>
        );
    }
});