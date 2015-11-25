<?php include_once('../include/php/config.php');?>
<?php include_once('../include/php/core.php');?>
<?php include_once('../include/php/init.php');?>
<?php
	$text = formatText($_POST['mensaje']);
	$idreceptor = intval($_GET['id']); //el otro
	$idemisor = intval($_SESSION['coluser']); //yo
	$fecha = date("Y-m-d H:i:s");
	
	if ($idreceptor>0 && $idemisor>0 && isset($text)) {
		$con = new bd;
		$con->abrirConexion();
		$sql = "insert into chat(remitente,destinatario,texto,fecha,leido) values($idemisor,$idreceptor,'$text','$fecha',0);";
		$con->ejecutarInfo($sql);
		$con->cerrarConexion();
		$con = null;
	}
?>