/**
 * The control panel.
 */
var Panel = {
    init: function() {
        var $algo = $('#algorithm_panel');

        $('.panel').draggable();
        
        // Initialize with A* selected
        $('#astar_section').show();
        
        $('.option_label').click(function() {
            $(this).prev().click();
        });
        
        $('#button2').attr('disabled', 'disabled');
    },
    
    /**
     * Get the user selected path-finder.
     */
    getFinder: function() {
        var finder, selected_header, allowDiagonal;
        
        selected_header = $('input[name=algorithm]:checked').attr('id');
        
        switch (selected_header) {
        case 'astar_header':
            allowDiagonal = typeof $('#astar_section .allow_diagonal:checked').val() !== 'undefined';
            finder = new PF.AStarFinder({
                allowDiagonal: allowDiagonal,
                heuristic: PF.Heuristic.manhattan
            });
            break;

        case 'breadthfirst_header':
            allowDiagonal = typeof $('#breadthfirst_section .allow_diagonal:checked').val() !== 'undefined';
            finder = new PF.BreadthFirstFinder({
                allowDiagonal: allowDiagonal
            });
            break;

        case 'bestfirst_header':
            allowDiagonal = typeof $('#bestfirst_section .allow_diagonal:checked').val() !== 'undefined';
            finder = new PF.BestFirstFinder({
                allowDiagonal: allowDiagonal,
                heuristic: PF.Heuristic.manhattan
            });
            break;
        }

        return finder;
    }
};
