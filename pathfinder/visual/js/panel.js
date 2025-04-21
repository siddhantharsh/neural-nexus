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
        var finder, selected_header;
        var allowDiagonal = $('#allow_diagonal').is(':checked');
        
        selected_header = $('input[name=algorithm]:checked').attr('id');
        
        switch (selected_header) {
        case 'astar_header':
            finder = new PF.AStarFinder({
                allowDiagonal: allowDiagonal,
                heuristic: PF.Heuristic.manhattan
            });
            break;

        case 'ucs_header':
            finder = new PF.DijkstraFinder({
                allowDiagonal: allowDiagonal
            });
            break;

        case 'breadthfirst_header':
            finder = new PF.BreadthFirstFinder({
                allowDiagonal: allowDiagonal
            });
            break;

        case 'bestfirst_header':
            finder = new PF.BestFirstFinder({
                allowDiagonal: allowDiagonal,
                heuristic: PF.Heuristic.manhattan
            });
            break;
        }

        return finder;
    }
};
