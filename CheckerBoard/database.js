(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';
    
    function base64ToFile(base64String) {
    	const dataString = atob(base64String);
    	const file = new File([dataString], "fileFromBase64");
    	return file;
    }
    
    async function isLibFile(file) {
    	const HEADER_SIZE = 20;
    	const MAJOR_FILE_VERSION_INDEX = 8;
    	const MINOR_FILE_VERSION_INDEX = 9;
    	const MAJOR_FILE_VERSION = 3;
    	const MINOR_FILE_VERSION = 4;
    	const CENTER = 0x78;
    	
        let VersionOk = false;
        const header = new Uint8Array([0xFF, "R".charCodeAt(), "e".charCodeAt(), "n".charCodeAt(), "L".charCodeAt(), "i".charCodeAt(), "b".charCodeAt(), 0xFF]);
        const buf = await file.slice(0, HEADER_SIZE).bytes();
        const dwRead = buf.bytelength();

        if (dwRead == HEADER_SIZE) {
            let HeaderMatch = true;
            for (let i = 0; i <= 7; i++) {
                if (buf[i] != header[i]) {
                    HeaderMatch = false;
                    break;
                }
            }

            if (HeaderMatch) {
                const m_MajorFileVersion = buf[MAJOR_FILE_VERSION_INDEX];
                const m_MinorFileVersion = buf[MINOR_FILE_VERSION_INDEX];

                if (100 * m_MajorFileVersion + m_MinorFileVersion <=
                    100 * MAJOR_FILE_VERSION + MINOR_FILE_VERSION) {
                    VersionOk = true;
                }
                else {

                }
            }
            else if (buf[0] == CENTER) {
                VersionOk = true;
            }
        }
        return VersionOk;
    }
    
    async function isDbFile(file) {
    	function isLZ4(uint8) {
    		return 0x184D2204 == (uint8[0] | uint8[1] << 8 | uint8[2] << 16 | uint8[3] << 24);
    	}
    	
    	const u8 = await file.slice(0,4).bytes();
    	return isLZ4(u8);
    }
    
    const TYPE_STR = {
    	tree:	"renjuTree",
    	lib:	"Renlib.lib",
    	db:		"Rapfi.db"
    }
    
    class Board extends CheckerBoard {
        constructor(...args) {
            super(...args);
            this.databaseType = "";
        }
    }
    
    Board.prototype.loadDatabase = async function(data) {
    	if (this.databaseType) {
    		await this.unLoadDatabase();
    	}
    	
    	const cName = data.constructor.name;
    	if (cName == "RenjuTree") {
    		this.addTree(data);
    		this.databaseType = TYPE_STR.tree;
    		return;
    	}
    	
    	if (cName == "String") {
    		data = base64ToFile(data);
    	}
    	
    	if (data.constructor.name == "File") {
    		if (isLibFile(data)) {
    			(await RenjuLib.openLib(file))
    			&& this.databaseType = TYPE_STR.lib;
    		}
    		else if(isDbFile(data)) {
    			(await DBClient.openDatabass(data,()=>{}) > 0)
    			&& this.databaseType = TYPE_STR.db;
    		}
    	}
    };
    
    Board.prototype.unLoadDatabase = async function() {
    	if (this.databaseType == TYPE_STR.tree) 
    		this.removeTree()
    	else if (this.databaseType == TYPE_STR.db) 
    		await DBClient.closeDatabass();
    	else if (this.databaseType == TYPE_STR.lib) 
    		RenjuLib.closeLib();
   
    	this.databaseType = "";
    };
    
    Board.prototype.updateBoard = async function() {
    	if (this.databaseType == TYPE_STR.tree) {
    		
    	}
    	else if (this.databaseType == TYPE_STR.db) {
    		
    	}
    	else if (this.databaseType == TYPE_STR.lib) {
    		
    	}
   
    	return RenjuLib.showBranchs({
    		path: cBoard.MS.slice(0, cBoard.MSindex + 1),
    		position: cBoard.getArray2D(),
    		callback: () => game.rule == Rule.RENJU && game.sideToMove == 0 && cBoard.getArray().map((color, idx, arr) => {
    			color == 0 && ("isFoul" in self) && isFoul(idx, arr) && cBoard.wLb(idx, EMOJI_FOUL, "red");
    		})
    	})
    };
    
    exports.CheckerBoard = Board;
})))
