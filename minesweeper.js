$( window ).on( 'load', function() {

    $("#game_board").hide();
    $("#new_game").hide();
    
    $("#start").on("click", initialize_game);
    $("#new_game").on( "click", new_game);
    
    $("#game_board").on("click", visit_position );
    $("#game_board").on("contextmenu", set_suspicious );
});

function get_click_coordinates(){
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left, y = event.clientY - rect.top;
    row = Math.floor( y / l );
    col = Math.floor( x / l );
}

function is_visited( cell ){
    var is_cell_visited = false;
    visited.forEach(element => {
        if (JSON.stringify( cell ) === JSON.stringify(element)){
            is_cell_visited = true;
        }
    });
    return is_cell_visited;
}

function is_suspicious(cell){
    var is_cell_suspicious = false;
    suspicious.forEach(element => {
        if (JSON.stringify( cell ) === JSON.stringify(element))
            is_cell_suspicious = true;
    });
    return is_cell_suspicious;
}

function is_opened(cell){
    var is_cell_opened = false;
    opened.forEach(element => {
        if ( element.row === cell.row && element.col === cell.col)
            is_cell_opened = true;
    });
    return is_cell_opened;
}

function initialize_game(){

    // ako je prazno polje -> kriv unos, inače može biti nula
    if ( $("#nRows").val() === '' || $("#nCols").val() === '' || $("#nMines").val() === '')
        alert("Popunite sva polja!");
    else{
        nRows = Number($("#nRows").val());
        nCols = Number($("#nCols").val());
        nMines = Number($("#nMines").val());
        visited = [];
        opened = [];
        suspicious = [];

        if ( nRows>=1 && nRows<=20 && nCols>=1 && nCols<=20 && nMines>=0 && nMines<=nRows*nCols ){

            $.ajax(
                {
                    url: 'https://rp2.studenti.math.hr/~zbujanov/dz4/id.php',
                    data:
                    {
                        nRows: nRows,
                        nCols: nCols,
                        nMines: nMines
                    },
                    dataType: "json",
                    success: function( data )
                    {
                        id = data.id;
                        draw_game_board();
                    },
                    error: function( xhr, exception )
                    {
                        console.log('Greška u Ajaxu!\n' + exception );
                    }
                });

            $("#start").hide();
            $("#parametars").hide();
            $("#game_board").show();
            $("#new_game").show();
        }
        else{
            alert("Dimenzije moraju biti brojevi takvi da je broj stupaca veći od 0, broj redaka manji od 21 i broj mina veći ili jednak 0 i manji ili jednak umnošku stupaca i redaka!");
        }
    }
}

function new_game(){
    nRows = '';
    nCols = '';
    nMines = '';
    id = '';

    $("#game_board").hide();
    $("#new_game").hide();
    $("#start").show();
    $("#parametars").show();
}

function draw_game_board(){

    l = 26;
    canvas = $("#game_board").get(0);
    ctx = canvas.getContext("2d");
    ctx.canvas.width = nCols * l;
    ctx.canvas.height = nRows * l;
    ctx.lineWidth = "2";
    ctx.strokeStyle = "#262626";

    for (var col = 0; col <= nCols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * l, 0);
        ctx.lineTo(col * l, nRows * l);
        ctx.stroke();
    }
    for (var row = 0; row <= nRows; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * l);
        ctx.lineTo(nCols * l, row * l);
        ctx.stroke();
    }
}

function set_suspicious(){

    get_click_coordinates();
    var cell = { row: row, col: col };

    // cell sumnjiva jedino ako još nije otvorena 
    if (!is_opened( cell )){
        // ako je vec bila sumnjiva sada vise nije
        if ( is_suspicious( cell ) ) {

            var suspicious_update = [];
            suspicious.forEach(element => {
                if (element.row !== row || element.col !== col )
                    suspicious_update.push( element );
            });
            suspicious = suspicious_update;

            ctx.lineWidth = "2";
            ctx.clearRect( col*l, row*l, l, l);
            ctx.strokeStyle = "#262626";
            ctx.strokeRect( col*l, row*l, l, l);
            ctx.fillStyle = "gray";
            ctx.fill();

        }
        //inace tek postaje sumnjiva
        else{ 
            suspicious.push( cell );
            ctx.lineWidth = "2";
            ctx.strokeStyle = "#262626";
            ctx.strokeRect( col*l, row*l, l, l);
            var image = new Image();
            image.src = 'flag.png';
            $(image).on('load', function(){
              ctx.drawImage(this, col*l, row*l, l, l);
            });
        }
    }
    return false;
}

function visit_position(){

    get_click_coordinates();
    var cell = { row: row, col: col };

    if ( !is_visited( cell ) && !is_suspicious( cell )){
        visited.push( cell );
        find_cells();
    }
}

function find_cells(){
    $.ajax({
        url: "https://rp2.studenti.math.hr/~zbujanov/dz4/cell.php",
        data: 
        {
            id: id,
            row: row,
            col: col,
        },
        dataType: "json",
        success: function (data) 
        {
            if (data.boom) {

                var image = new Image();
                image.src = 'mine.png';
                $(image).on('load', function(){
                  ctx.drawImage(this, col*l, row*l, l, l);
                });

                ctx.fillStyle = "red";
                ctx.fillRect( col * l, row * l, l, l);
                ctx.strokeStyle = "#262626";
                ctx.strokeRect( col*l, row*l, l, l);

                alert("Izgubili ste!");
                new_game();
            }
            else {

                data.cells.forEach(element => {

                    // je li element otvoren
                    var new_cell = true;
                    for(var i = 0; i < opened.length; ++i){
                        if (JSON.stringify(element) === JSON.stringify(opened[i]))
                            new_cell = false;
                    }
                    // ako element nije bio otvoren i ako nije zastavica na njemu
                    if( new_cell && !is_suspicious({row: element.row, col:element.col})){

                        opened.push(element);
                        ctx.strokeStyle = "#262626";
                        ctx.fillStyle = "#DCDCDC";
                        ctx.fillRect(element.col * l, element.row * l, l, l);
                        ctx.strokeRect(element.col * l, element.row * l, l, l);

                        // ako cell nije prazna ispiši i broj mina u blizini
                        if (element.mines !== 0){

                            switch (element.mines ){
                                case 1:
                                    ctx.fillStyle = "blue";
                                    break;
                                case 2:
                                    ctx.fillStyle = "green";
                                    break;
                                case 3:
                                    ctx.fillStyle = "red";
                                    break;
                                case 4: 
                                    ctx.fillStyle = "darkblue";
                                    break;
                                default:
                                    ctx.fillStyle = "black";
                                }
                            ctx.font = "bold 15px Comic Sans MS";
                            ctx.textAlign = "center";
                            ctx.fillText( element.mines, element.col * l + 13, element.row * l + 18 );
                        }

                        // pobjeda
                        if( opened.length === nRows*nCols-nMines ){
                            alert("Čestitamo. Pobijedili ste!");
                            new_game();
                        }
                    }
                })
            }
        },
        error: function( xhr, exception )
        {
            console.log('Greška u Ajaxu!\n' + exception );
        }
    });
}
