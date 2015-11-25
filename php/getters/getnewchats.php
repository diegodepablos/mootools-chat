<?php include_once('../include/php/config.php');?>
<?php include_once('../include/php/core.php');?>
<?php include_once('../include/php/init.php');?>
<?php
	noCache();
	$user = intval($_SESSION['coluser']);
	$informacion = Array();
	 
	if ($user>0) {
		$con = new bd;
		$con->abrirConexion();
		
		$sql = "select distinct remitente as id,apodo from chat,usuario where chat.remitente=usuario.idusuario and destinatario=$user and leido=0 and chat.borrado=0 order by apodo asc;";
		$con->obtenerInfo($sql);
		$i=0;
		while($con->leerInfo()) {
			$dato = $con->getRegistro();
			$informacion[$i]["id"] = $dato["id"];
			$informacion[$i]["apodo"] = $dato["apodo"];
			$i++;
		}	
		echo(json_encode($informacion));
	}
?>