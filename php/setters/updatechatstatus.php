<?php include_once('../include/php/config.php');?>
<?php include_once('../include/php/core.php');?>
<?php include_once('../include/php/init.php');?>
<?php
	$idreceptor = intval($_GET['id']);
	$idemisor = intval($_SESSION['coluser']);
	$maximizado = $_GET['m'];
	$abierto = $_GET['o'];
	$posicion = $_GET['p'];
	
	if ($maximizado=='true') {
		$maximizado = 1;
	} else if ($maximizado=='false') {
		$maximizado = 0;
	}
	
	if ($abierto=='true') {
		$abierto = 1;
	} else if ($abierto=='false') {
		$abierto = 0;
	}
	
	if ($idreceptor>0 && $idemisor>0) {
		$con = new bd;
		$con->abrirConexion();
		
		/* si el receptor no tiene un registro de estado, se lo creamos */
		$sql = "select count(*) from chat_estado where remitente=$idreceptor and destinatario=$idemisor;";
		$con->obtenerInfo($sql);
		$con->leerInfo();
		$estado = $con->getRegistro();
		$estado = $estado[0];
		if ($estado==0) {
			
			//calculamos la posicion, el ultimo que tenga abierto mas uno
			$sql = "select max(posicion) as posicion from chat_estado where abierto=1 and remitente=$idreceptor;";
			$con->obtenerInfo($sql);
			$con->leerInfo();
			$posicionContrario = $con->getRegistro();
			if (empty($posicionContrario['posicion'])) {
				$posicionContrario = 0;
			} else {
				$posicionContrario = $posicionContrario['posicion'];
			}
			$sql = "insert into chat_estado(remitente,destinatario,abierto,maximizado,posicion) values($idreceptor,$idemisor,0,1," . ($posicionContrario+1) . ");";
			$con->ejecutarInfo($sql);
		} 
		
		/* si yo no tengo un registro de estado lo creo pues he cambiado el estado de mi ventana */		
		$sql = "select count(*) from chat_estado where remitente=$idemisor and destinatario=$idreceptor;";
		$con->obtenerInfo($sql);
		$con->leerInfo();
		$estado = $con->getRegistro();
		$estado = $estado[0];
		if ($estado==0) {
			$sql = "insert into chat_estado(remitente,destinatario,abierto,maximizado,posicion) values($idemisor,$idreceptor,1,1," . ($posicion+1) . ");";
			$con->ejecutarInfo($sql);
		} 
		
		if (isset($maximizado)) {
			$sql = "update chat_estado set maximizado=" . intval($maximizado) . " where destinatario=$idreceptor and remitente=$idemisor;";
			$con->ejecutarInfo($sql);
		}
		if (isset($abierto)) {
			if ($abierto==0) {
				$sql = "update chat_estado set abierto=" . intval($abierto) . ", posicion=0, maximizado=1 where destinatario=$idreceptor and remitente=$idemisor;";
				$con->ejecutarInfo($sql);
				
				//les quitamos una posicion a todas las demas ventanas
				$sql = "update chat_estado set posicion=posicion-1 where posicion>0 and abierto=1 and remitente=$idemisor;";
			} else {
				$sql = "update chat_estado set abierto=" . intval($abierto) . ", posicion=" . ($posicion+1) . " where destinatario=$idreceptor and remitente=$idemisor;";
			}
			$con->ejecutarInfo($sql);
		} 
		$con->cerrarConexion();
		$con = null;
	}
?>