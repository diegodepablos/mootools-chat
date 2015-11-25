<?php include_once('../include/php/config.php');?>
<?php include_once('../include/php/core.php');?>
<?php include_once('../include/php/init.php');?>
<?php
	noCache();
	$idreceptor = intval($_GET['id']);
	$idemisor = intval($_SESSION['coluser']);
	
	/* valores por defecto */
	$informacion = Array();
	$informacion["nuevos"] = 0;
	$informacion["abierto"] = 0;
	$informacion["abiertocontrario"] = 0;
	$informacion["maximizado"] = 0;
	$informacion["maximizadocontrario"] = 0;
	$informacion["cabecera"] = "";
	$informacion["notificacion"] = null;
	$informacion["mensajes"] = Array();
	/* ***************     */
	 
	if ($idreceptor>0 && $idemisor>0) {
		$con = new bd;
		$con->abrirConexion();
		
		$sql = "select apodo,conectado from usuario where idusuario=$idreceptor;";
		$con->obtenerInfo($sql);
		$con->leerInfo();
		$dato = $con->getRegistro();
		$informacion["cabecera"] = $dato["apodo"];
		
		if ($dato["conectado"]==0) {
			$informacion["notificacion"] = sprintf(_("%s has signed out"),$dato["apodo"]);
		}
		
		$sql = "select u1.idusuario as idemisor, u1.apodo as remitente,u2.idusuario as idreceptor, u2.apodo as destinatario, texto, c.fecha from chat as c JOIN usuario as u1 ON u1.idusuario=c.remitente JOIN usuario as u2 ON u2.idusuario=c.destinatario where ((u1.idusuario=$idemisor and u2.idusuario=$idreceptor) or (u2.idusuario=$idemisor and u1.idusuario=$idreceptor)) and c.borrado=0 order by c.idmensaje desc;";
		$resultado = $con->obtenerInfo($sql);
		
		//hay que recorrerlo en orden inverso
		for ($i=$con->getFilas();$i>0;$i--) {
			$con->mover($resultado,$i-1);
			$con->leerInfo();
			$mensaje = $con->getRegistro();
			$emisor = $mensaje['remitente'];
			$clase = "";
			
			if ($mensaje['idemisor']==$idemisor) {
				$emisor = _("Me");
				$clase = "me";
			}
			
			$informacion["mensajes"][$con->getFilas()-$i] = "<p class=\"" . $clase . "\"><span>" . $emisor . ":</span> " . $mensaje['texto'] . "</p>"; 
		}
		
		$sql = "select abierto,maximizado from chat_estado where destinatario=$idreceptor and remitente=$idemisor;";
		$con->obtenerInfo($sql);
		$con->leerInfo();
		$dato = $con->getRegistro();
		
		$informacion["abierto"] = $dato['abierto'];
		$informacion["maximizado"] = $dato['maximizado'];
		
		$sql = "select count(*) as nuevos from chat where leido=0 and destinatario=$idemisor and remitente=$idreceptor;";
		$con->obtenerInfo($sql);
		$con->leerInfo();
		$nuevos = $con->getRegistro();
		$informacion["nuevos"] = $nuevos['nuevos'];
			
		if ($dato['maximizado']==0 && $dato['abierto']==1 && $nuevos['nuevos']>0) {
			//lo tiene abierto y minimizado
			$informacion["cabecera"] = $informacion["cabecera"] . " (" . $nuevos['nuevos'] . ")";
		}
		
		//ahora establecemos los mensajes como leidos siempre y cuando el receptor tenga abierta su ventana
		if ($dato['maximizado']==1 && $dato['abierto']==1) {
			$sql = "update chat set leido=1 where destinatario=$idemisor and remitente=$idreceptor;";
			$con->ejecutarInfo($sql);
		}
		
		//le ofrecemos la información de estado de la ventana del otro usuario
		$sql = "select abierto,maximizado from chat_estado where destinatario=$idemisor and remitente=$idreceptor;";
		$con->obtenerInfo($sql);
		$con->leerInfo();
		$dato = $con->getRegistro();
		
		$informacion["abiertocontrario"] = $dato['abierto'];
		$informacion["maximizadocontrario"] = $dato['maximizado'];
		
		$con->cerrarConexion();
		$con = null;
		
		echo(json_encode($informacion));
	}
?>