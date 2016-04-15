var SpTabs = function(){
  
  var listName = '';
  var webPartId = '';
  var ListItemEntityTypeFullName = '';
  var userCanEdit = false;
  var pageId = '';
  var errors = Array();
  var items = Array();
  var editMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value; 
  var EditorOptions = {
      texteffects : false,
      aligneffects : false,
      textformats: false,
      fonteffects : false, 
      actions : false,
      insertoptions : false,
      extraeffects : false,
      advancedoptions : false,
      screeneffects:false, 
      ol:false,
      ul:false,
      undo:false,
      redo:false,
      l_align:false,
      r_align:false,
      c_align:false,
      justify:false,
      insert_img:true,
      hr_line:false,
      block_quote:false,
      source:false,
      strikeout:false,
      indent:false,
      outdent:false,
      fonts:false,
      styles:false,
      print:false,
      rm_format:false,
      status_bar:false,
      font_size:false,
      color:false,
      splchars:false,
      insert_table:false,
      select_all:false,
      togglescreen:true
    }
  
  //private functions 
  function setPageId(){
    var listId = _spPageContextInfo.pageListId; 
    listId = listId.replace(/\{|\}/g,'');
    pageId = listId + ":" +_spPageContextInfo.pageItemId;
    // console.log(pageId)
  }
  
  function setListName(list){
    listName = list;
  }
  function setWebPartId(id){
    webPartId = id;
  }
  function getId(){
    return '#' + webPartId + ' ';
  }
  
  function addNewForm(){
    var source = $("#tabs-content-form-template").html(); 
    var template = Handlebars.compile(source); 
    $(getId()+'.addNewContainer').html(template());
    $(getId()+'.addNewContainer .tab-item').removeClass('hidden');   
    $(getId()+'.addNewContainer .tab-item').attr('data-id','addNew');   
    $(getId()+'.addNewContainer .editable-content').Editor(EditorOptions);
    $(getId()+'.addNewContainer .Editor-editor').html('');
    $(getId()+'.addNewContainer input[name="tab-order"]').val(findOrder());
    
    $(getId()+'.addNewContainer .save-changes').on('click',function(){      
      var id =$(this).closest('.tab-item').attr('data-id');   
      if(validateFields(id)){
          $(this).addClass('fetching').html('<i class="fa fa-refresh fa-spin"></i> Saving...');  
          $(getId()+'.editmode').css({'opacity':'.4'});
          setTimeout(function(){
            var ajax = submitChanges(id); 
            ajax.done(function(data, xhr){
              var newId = data.d.Id;
              var ajax2 = getContent();
              ajax2.done(function(data){
                $(getId()+'.tabs-navigation li a[data-id="'+newId+'"]').trigger('click');
                addButton();
              });
            });
          },1000);
      }else{
        showErrorMessage(id);
      }
      return false;
    })
    
    
    
    
  }
  
  
  function setListItemEntityTypeFullName(){
    var endpoint =  _spPageContextInfo.webAbsoluteUrl; 
    endpoint += "/_api/web/lists/getbytitle('"+listName+"')?$select=ListItemEntityTypeFullName"; 
    var ajax = $.ajax({
      url: endpoint,
      method: "GET",
      headers: { "Accept": "application/json; odata=verbose" }, 
      success : function(data){
        ListItemEntityTypeFullName = data.d.ListItemEntityTypeFullName; 
      },
      error : function(data){
        var msgObj = JSON.parse(data.responseText);
        var msg = '<p class="bg-danger">';
        msg += msgObj.error.message.value;       
        msg += '</p>'; 
        $(getId()+'.tabs-content').html(msg); 
      }
    });
  }
  
  
  function buildTabsHtml(){
    // console.log(items);
    
    var source = $("#tabs-navigation-template").html();  
    var template = Handlebars.compile(source); 
    $(getId() + '.tabs-navigation').html(template(items));
    //atach handlers 
    $(getId()+'.tabs-navigation li a').on('click',function(){
      $(getId()+'.tabs-navigation li').removeClass('active');
      $(this).closest('li').addClass('active');
      var id = $(this).attr('data-id');
      $(getId()+'.tab-item').addClass('hidden');
      $(getId()+'div.tab-item[data-id="'+id+'"]').removeClass('hidden');      
      if(id === 'addNew'){
        addNewForm();
      }      
    })
    
  }
  
  function deleteRecord(tab){
    var ajax = $.ajax({
       url: tab.__metadata.uri,
       type: "POST",
       headers: {
           "Accept": "application/json;odata=verbose",
           "X-RequestDigest": $("#__REQUESTDIGEST").val(),
           "X-HTTP-Method": "DELETE",
           "If-Match": tab.__metadata.etag
       },
       success: function (data) {
          console.log('record has been deleted');
       },
       error: function (data) {
          console.log('there was a problem with deleting the record');
       }
   });
   return ajax;
  }
  
  
  function resetMode(openFirstTab){    
    $('.editmode').addClass('hidden');
    $('.addNewTab').addClass('hidden');
    $('.viewmode').removeClass('hidden');
    $('.edit-tabs').removeClass('hidden');
    $('.cancel-edit-tabs').addClass('hidden');
    if(openFirstTab == true){
        $(getId()+'.tabs-navigation li').first().find('a').trigger('click');
    }
  } 
  
  function goInEditMode(){    
    resetMode(false);
    $(getId()+'.addNewTab').removeClass('hidden');
    $(getId()+'.edit-tabs').addClass('hidden');
    $(getId()+'.cancel-edit-tabs').removeClass('hidden');
    $(getId()+'.viewmode').addClass('hidden');
    $(getId()+'.editmode').removeClass('hidden');
  }
  
  function buildTabsContentHtml(){
    var source = $("#tabs-content-template").html();  
    var template = Handlebars.compile(source); 
    Handlebars.registerPartial("tabForm", $("#tabs-content-form-template").html());
    $(getId() + '.tabs-content').html(template(items));    
    
    $.each(items,function(i,item){
      $(getId()+'[data-id="'+item.Id+'"] .editable-content').Editor(EditorOptions);
      $(getId()+'[data-id="'+item.Id+'"] .Editor-editor').html(item.content);
    })    
    
    $(getId()+'.save-changes').on('click',function(){     
      var id =$(this).closest('.tab-item').attr('data-id');      
      if(validateFields(id)){
        $(this).addClass('fetching').html('<i class="fa fa-refresh fa-spin"></i> Saving...');  
        $(getId()+'.editmode').css({'opacity':'.4'});
        setTimeout(function(){
          var ajax = submitChanges(id); 
          ajax.done(function(data, xhr){  
              var ajax2 = getContent();
              ajax2.done(function(){
                $(getId()+'.tabs-navigation li a[data-id="'+id+'"]').trigger('click');
                addButton();
              });            
          });
        },1000);
      }else{
        showErrorMessage(id);
      }
      return false;
    })
    
    $(getId()+'.delete-record').on('click',function(){
      clicked = confirm("Are you sure you want to delete this tab? This cannot be undone.");
      if(clicked === true){
        var id = $(this).closest('.tab-item').attr('data-id');
        $(this).addClass('fetching').html('<i class="fa fa-refresh fa-spin"></i> Deleting...');  
        $(getId()+'.editmode').css({'opacity':'.4'});
        setTimeout(function(){          
          var ajax = deleteRecord(findItem(id));           
          ajax.done(function(d,xhr){
              var ajax2 = getContent();
              ajax2.done(function(){
                addButton();
              });
          })
        },1000)        
        
        return false;
      }else{
        return false;
      }
    })
    
    
  };
  
  function findItem(id){
    var tab = {};
    $.each(items,function(i,item){
      if(id == item.Id){
        tab = item;
      }
    })
    return tab;
  }
  
  function findOrder(){
    var order; 
    order = items.length + 1; 
    return order;
  }
  
  function showErrorMessage(id){
    
    $.each(errors,function(i,er){
      // console.log(er.field);
      var field = '';
      if(er.field === 'content'){
        field = $(getId()+'[data-id="'+id+'"] .Editor-container');
      }else{
        field = $(getId()+'[data-id="'+id+'"] input[name="'+er.field+'"]');
      }
      $('<div class="error">'+er.message+'</div>').insertAfter(field);
    })
  }
  
  function validateFields(id){
    
    errors = [];
    $('.error').remove();    
    
    var title = $(getId()+'[data-id="'+id+'"] input[name="title"]'); 
    var content = $(getId()+'[data-id="'+id+'"] .Editor-editor'); 
    var tabOrder = $(getId()+'[data-id="'+id+'"] input[name="tab-order"]'); 
    
    if(title.val() == ''){
      var obj = {};
      obj.field = 'title'; 
      obj.message = 'Title cannot be empty'
      errors.push(obj);
    }
    if(content.html() == ''){
      var obj = {};
      obj.field = 'content'; 
      obj.message = 'Content cannot be empty'
      errors.push(obj);
    }      
    if(tabOrder.val() == ''){
      var obj = {};
      obj.field = 'tab-order'; 
      obj.message = 'Tab order cannot be empty'
      errors.push(obj);
    }      
    
    if(errors.length > 0){      
      return false;
    }
    
    return true;
  } 
  
  function submitChanges(id){
      
      var item = {
        "__metadata": { "type": ListItemEntityTypeFullName },
        "Title" :   $(getId()+'[data-id="'+id+'"] input[name="title"]').val(), 
        "content" : $(getId()+'[data-id="'+id+'"] .Editor-editor').html(), 
        "tab_x002d_order" : $(getId()+'[data-id="'+id+'"] input[name="tab-order"]').val() 
      }; 
      
      if(id === 'addNew'){
        
        item.webpart_x002d_id = webPartId;  
        var endpoint = "/_api/web/lists/getbytitle('" + listName + "')/items";
        ajax = $.ajax({
           url: _spPageContextInfo.webAbsoluteUrl + endpoint,
           type: "POST",
           contentType: "application/json;odata=verbose",
           data: JSON.stringify(item),
           headers: {
               "Accept": "application/json;odata=verbose",
               "X-RequestDigest": $("#__REQUESTDIGEST").val()
           },
           error: function (data) {
              console.log(data);
           }
       });        
       return ajax;
      } //end addNew;
      
    
      var tabItem = findItem(id);
       
      ajax = $.ajax({
         url: tabItem.__metadata.uri,
         type: "POST",
         contentType: "application/json;odata=verbose",
         data: JSON.stringify(item),
         headers: {
             "Accept": "application/json;odata=verbose",
             "X-RequestDigest": $("#__REQUESTDIGEST").val(),
             "X-HTTP-Method": "MERGE",
             "If-Match": tabItem.__metadata.etag
         },
         error: function (data) {
            console.log(data);
         }
     });     
     return ajax;
  }
  
  function addButton(){
    if(editMode !== 1){
      var html = "";
      html += '<a class="edit-tabs"><i class="fa fa-pencil-square-o"></i>edit</a>';
      html += '<a class="cancel-edit-tabs hidden"><i class="fa fa-ban"></i>cancel</a>';
      $(getId()+'.tabs-navigation').prepend(html);
      $(getId()+'.edit-tabs').on('click',function(){
        goInEditMode();
      });
      $(getId()+'.cancel-edit-tabs').on('click',function(){
        resetMode(true);
      });
    }    
  }  
  
  
  function checkPermissions() {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {      
      var call = jQuery.ajax({
          url: _spPageContextInfo.webAbsoluteUrl +
              "/_api/Web/lists/getbytitle('"+listName+"')/effectiveBasePermissions",
          type: "GET",
          dataType: "json",
          headers: {
              Accept: "application/json;odata=verbose"
          }
      });
  
      call.done(function (data, textStatus, jqXHR) {          
          var permissions = new SP.BasePermissions();
          permissions.initPropertiesFromJson(data.d.EffectiveBasePermissions);
          var permLevels = [];
          
          for(var permLevelName in SP.PermissionKind.prototype) {   
              if (SP.PermissionKind.hasOwnProperty(permLevelName)) {
                  var permLevel = SP.PermissionKind.parse(permLevelName);
                  if(permissions.has(permLevel)){
                        permLevels.push(permLevelName);
                  }
              }     
          }
          // console.log(permLevels);
          if($.inArray('editListItems',permLevels) != -1){
            userCanEdit = true;
            addButton(); 
          }else{
            console.log('You dont have "editListItems" permissions on '+ listName);
          }
          
      });  //end done
      
    });
  }
   
  
  
  //public functions
  
  
  var init = function(obj){
    //error check
    setListName(obj.listName); 
    setWebPartId(obj.webPartId);
    setListItemEntityTypeFullName();   
    checkPermissions();    
  }
  
  
  var getContent = function(obj){
    
    
    var endpoint = "/_api/web/lists/getbytitle('"+listName+"')/Items?";   
    endpoint = _spPageContextInfo.webAbsoluteUrl + endpoint + '$orderby=tab_x002d_order asc'; 
    // endpoint += "&$filter=page_x002d_id eq '"+pageId+"'";
    endpoint += "&$filter=(webpart_x002d_id eq '"+webPartId+"')";
    // endpoint += " (page_x002d_id eq '"+pageId+"')";
    var ajax = $.ajax({
      url: endpoint,
      method: "GET",
      headers: { "Accept": "application/json; odata=verbose" }, 
      success : function(data){
        items = data.d.results; 
        buildTabsHtml();
        buildTabsContentHtml();
      },
      error : function(data){
        console.log(data);
      }
    });
    
    return ajax;
  }
  
  return {
    init : init,
    getContent : getContent    
  }
  
}

Handlebars.registerHelper('isHidden', function(index) {
  var className = "";
  if (index != 0){
    className = "hidden"
  }
  return className;
});

Handlebars.registerHelper('isActive', function(index) {
  var className = "";
  if (index == 0){
    className = "active"
  }
  return className;
});