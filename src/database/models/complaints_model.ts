export interface ComplaintsModel{
   id:String;  //id da denuncia
   description:String;
   created_at: Date;  //data de criação da denuncia
   updated_at: Date;  //data da ultima atualização
   address: Array<{
    city: String;
    district: String;
    fallback_name: String;
    latitude: Number; 
    longitude: Number;
    postal_code: String;
    state: String;
    street: String;
   }>;
   situation:Array<{     
   status: Number;
   }>;         // conjunto de informações sobre o status da denuncia
  image_url:String;  //imagem(s) da denuncia 
  thumbnail_url: String;  //imagem reduzida 
  similar_count:Number;  //numero de denuncias parecidas (mesmo endereço ou endereço próximo)
  user_id:String;    //id do usuário que criou a denuncia 
  user_name:String;  // nome do usuario que criou a denuncia 
}