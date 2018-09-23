
$(document).ready(function (){
    
    $("#agree").change(function() {
        if($(this).prop('checked') == true) {
            $("#cte a").toggleClass("disabled");
        }else{
            $("#cte a").toggleClass("disabled");
        }
    });
    
    $("#cte").on("click", function(){
        if ($("#agree").prop('checked') == true){
            $("#tmcn").toggleClass("hide");
            $("#mainInfo").toggleClass("hide");
        }else{
            alert('Please indicate that you have read and agree to the Terms and Conditions and Privacy Policy');
        }
    });    
    
    $("#stExp").on("click", function() {
        $("#mainInfo").toggleClass("hide");
        $("#expmnt").toggleClass("hide");
    });

    var st; //  Topic integer selected by the user
    var doc_data = []; // lists that stores all the document
    var alpha; // alpha matrix of search format to narrow down on a document
    var round; // dic to store data of each round 
    var tp_wd; // topic_word distribution for sampling of the document according to the probability
    var r = 0; // round id of the experiment for a user, starts with zero
    var roundsView = []; // contains the previous rounds viewed when at a given round
    var docsView = []; // contains the documents viewed from the available documents in a given round
    var traversePath = []; //List containg the round and the assciated data
    var stView = []; // topic selected and its time in each round
    var dstat = 0; // document view count integer
    var cstat = 0; // clicks status integer
    var rstat = 0; // round view count integer
    var rdStatus = false;
    var summaryData; // variable that stores the summary provided by the user
    var startTime = new Date(); // experiment start time
    var endTime; // end time of the experiment
    var totalTime; // total time of the experiment
    var currentDoc = []; // list that stores the index no of all the active documents in a given round
    var totalDocs = currentDoc.length;
    var roundTime; // time spend in each round
    var sg = 3; // no of suggestion in each round
    var topicRound; // variable to store topic document matrix
    
    function updateRound(){
        // stores all the data of each round and reset the data structure values
        tempRound = {};
        if (r==undefined){
            tempRound["roundID"] = "Explored all rounds";
        }else{
            tempRound["roundID"] = r;
        }
        tempRound["roundTime"] = roundTime;
        tempRound["st"] = stView;
        tempRound["rv"] = roundsView;
        tempRound["dv"] = docsView;
        tempRound["cd"] = currentDoc;
        tempRound["timeTaken"] = "";
        tempRound["summary"] = "";
        tempRound["assignmentId"] = "";
        tempRound["hitId"] = "";
        tempRound["workerId"] = "";
        traversePath.push(tempRound);
        roundsView = [];
        docsView = [];
        stView = [];
    }
    
    function cleanText(str){
        // clean the text and provide the words list
        str = str.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
        str = str.toLocaleLowerCase();
        str = str.split(" ");
        return str;
    }

    function cleanText2(str){
        str = str.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
        str = str.toLocaleLowerCase();
        return str;
    }
    
    function addExpData(){
        // add the experiment data and turk data
        for (i=0; i<traversePath.length; i++){
            delete traversePath[i].cd;
        }
        traversePath[0]["timeTaken"] = totalTime;
        traversePath[0]["summary"] = summaryData;
        traversePath[0]["assignmentId"] = turk["assignmentId"];
        traversePath[0]["hitId"] = turk["hitId"];
        traversePath[0]["workerId"] = turk["workerId"];
    }
    
     $.getJSON("/data/inputData.json", function(data){
        var doc_obj = data["documents"];
        doc_obj.forEach(function(doc) {
            doc_string = JSON.stringify(doc)
            doc_data.push(doc_string);
        });

        round = data["round_data"];
        alpha = data["alpha"];
        topicRound = data["topic_round"];
        tp_wd = data["tp_wd"];

        for (var i = 0; i < doc_data.length; i++) {
            currentDoc.push(i);
        }
        var cdl= currentDoc.length;
        
        function sampleDoc1(npTd){
            // sample doc to display
        	var docIndex;
        	var rndm = Math.random();
        	var docIdxList = [];
        	npTd.forEach(function(p, npIdx){
        		if(rndm <= p){
        		    docIdxList.push(npIdx);
        		}
        	});
        	docIndex = docIdxList[0];
        	return docIndex;
        }
        
        function sampleDoc2(){
            // sample doc to display
        	var docIndex;
        	var probTd = [];
        	var rndm = Math.random();
        	var prsum = 0;
        	for(var i = 0; i< currentDoc.length; i++){
        	    prsum = prsum + (1 /currentDoc.length);
        		probTd.push(prsum);
        	}
        	var docIdxList = [];
        	probTd.forEach(function(up,upIdx){
        		if(rndm <= up){
        			docIdxList.push(upIdx);
        		}
        	});
        	docIndex = docIdxList[0];
        	return docIndex;
        }
        
        function sampleDoc(currentDoc, stp){
            //Create the probablity distribution of the doc for a given topic
        	var cTd = [];
        	var docIndex;
        	countSum = 0;
        	currentDoc.forEach(function(docIdx){
        		countSum = countSum + tp_wd[stp][docIdx];
        		cTd.push(tp_wd[stp][docIdx]);
        	});
        	var npTd = []; //global variable
        	pSum = 0;
        	cTd.forEach(function(count){
        		pSum = pSum + (count / countSum)
        		npTd.push(pSum);
        	});
        	if ((cTd.sort()[cTd.length-1]) === 0){
        		docIndex = sampleDoc2();
        	}else{
        		docIndex = sampleDoc1(npTd);
        	}
        	return docIndex;
        }
        
        function getTopWords(){
            // get all the top words from all rounds selected by the user
        	var selectedTopics = $(".stwd");
        	var selectedWords = [];
        	for (var i=0; i<selectedTopics.length; i++){
        		var topicWords = cleanText(selectedTopics[i].innerHTML);
        		topicWords.forEach(function(wd){
        			selectedWords.push(wd);
        		});
        	}
        	return selectedWords;
        }
        
        function createDoc(docwd){
            // create the document with highlighted top words
            var docwds = docwd.split(" ");
        	var topWords = getTopWords();
        	var htdoc = "";
        	var cleanedWd;
        	docwds.forEach(function(dwd){
        	    cleanedWd = cleanText2(dwd);
        		if(topWords.indexOf(cleanedWd) != -1){
        			htdoc = htdoc + " " + "<span class='htwd'>" + dwd + "</span>";
        		}else{
        		    htdoc = htdoc + " " + dwd;	
        		}
        	});
        	htdoc = htdoc.replace(" ", "");
        	return htdoc;
        }

        function addDocStatus(){
            // add the status of the range of the document left
            var min = Math.min.apply(null, currentDoc);
            var max = Math.max.apply(null, currentDoc);
            if (min!==max){
                var docStatus = $("<strong id='ds'>Document Status: "+ (min+1)+"-"+(max+1)+" /1-"+doc_data.length+" </strong>");    
            }else{
                var docStatus = $("<strong id='ds'>Document Status: "+ (max+1) +" /1-"+str(totalDocs) +"</strong>");    
            }
            $("#ds").remove();
            $("#docform button").after(docStatus);
        }
        

        function checkStatus(){
            // check the status of different parameter values for the display of the submit button
            if (currentDoc.length === 1){
                rdStatus = true;
            }
            if (dstat >= 10 && rdStatus && (cstat+rstat+dstat >= 60)){
                $(".sbmt").removeClass("hide");
            }
        }

        function removeDoc(){
            // remove the document in display
            $("#vd h5").remove();
            $("#vd p").remove();          
        }
        
        function addStatus(){
            // add the status of the paramter values for the completion of the experiment
            $("#statusContent").find("*").remove();
            var cs = dstat + rstat + cstat;
            var stat3 = "<p>Total number of clicks (including clicks in the <b>Topics Selected</b> panel, the <b>Topics of Current Round</b> panel, and those on the 'Display' button in the <b>Document</b> panel): ";
            var stat4 = "/ 60.</p>";
            var statusData = $(stat3 + cs + stat4);
            $("#statusContent").append(statusData);
        }
        
        function addDoc(docId){
            // add the document to view in a round from the available documents
            var dtime = new Date();
            getTopWords();  
            removeDoc();
            dstat = dstat + 1;
            checkStatus();
            var displayNumber = String(Number(docId)+1);
            docsView.push(docId);
            docsView.push(dtime.toString());
            var docDisplay = createDoc(doc_data[docId]);
            var docm = $("<h5>Document "+ displayNumber + "</h5><p>" + docDisplay + "</p>");
            $("#vd").append(docm);
            $('#vd').show();
        }   

        function addCT(r){
            // Add the HTML element of the topics  to the current Topic Area based on r from the input data
            var rt = new Date();
            roundTime = rt.toString();
            $('#ct li').remove(); // Remove existing elements before adding new element
            var cnt = Math.min((sg-1), (currentDoc.length-1)); // No of topics to be displayed in a round is minimum of suggestion or current range of documents available.
            var displayTopic = $("#dm h5").length +1 // topics seen by the user availale in the dropdown Menu
            for (var tp=0; tp<=cnt; tp++){
                var topicNo = String(round[String(r)][String(tp)]["topic"]);
                var topicWd = round[r][tp]["topic_words"];
                var topicList = $("<li><h5>Topic<span id='dytpid' class='hide'>"+ String(displayTopic+tp) +"</span> <span id='tpid'>"+ String(Number(topicNo)+1)+"</span> Words: "+ topicWd+"<h5></li>");
                $("#ct").append(topicList);             
            }   
        }               

        function getDocId(idx){
            // get the document index from the total document given the id from the current range of available document
            sortedDoc = [];
            setDoc = new Set(currentDoc);
            setDoc.forEach(function(i){
                sortedDoc.push(i);
            });
            dId = sortedDoc[idx];
            return dId;
        }

        function fetchCurrentDoc(r){
            // fetch the index of the documents of round r
            var docFound;
            notFound = true;
            i = (traversePath.length - 1);
            while(notFound){
                if (traversePath[i]["roundID"] === r){
                    docFound = traversePath[i]["cd"];
                    notFound = false;
                }
                i = i - 1;
                if (i<0){
                    notFound = false;
                }
            }
            return docFound;
        }

        function fetchCurrentTopic(r){
            // fetch the topics for the round r
            var topicFound;
            notFound = true;
            i = (traversePath.length - 1);
            while(notFound){
                if (traversePath[i]["roundID"] === r){
                    topicFound = traversePath[i]["st"][0];
                    notFound = false;
                }
                i = i - 1;
                if (i<0){
                    notFound = false;
                }
            }
            return topicFound;
        }
        
        function addVT(vr){
            // create the dropdown HTML view of the all the topics attached to selected topic of the round 
            var topicList = "";
            if (vr===0){
                cnt = (sg-1);
            }else{
                cd = fetchCurrentDoc(vr);
                cnt = Math.min((sg-1), (cd.length-1))
            }
            var displayTopic = $("#dm h5").length +1
            for (var tp=0; tp<=cnt; tp++){
                var topicNo = String(round[String(vr)][String(tp)]["topic"]);
                var topicWd = round[vr][tp]["topic_words"];
                topicList = topicList + "<h5>Topic No:"+String(Number(topicNo)+1) +" "+ topicWd +"</h5>";
            }
            var menu =$("<span>"+topicList+"</span>");
            return menu;
        } 
        
        function addST(st, dst, r){
            // add the HTML element of the selected topic
            var dropMenu = addVT(r).html();
            var tp;
            if (r == 0){
                tp = st;
            }else{
                tp = st - (topicRound[r-1]+1);
            }
            var dr = $("#ts>li").length +1;
            var topicWd = round[r][tp]["topic_words"];
            var choice = $("<li><span>Round:"+ dr +" <span class='rnb hide'>" + (r+1) + "</span> Choice: <span class='sc'>"+ (st+1) + "</span> |  Words: <span class ='stwd'>"+ topicWd+"</span></span></li>").append($("<div class='hide' id='dm'><ul>"+dropMenu+"</ul></div>"));
            $("#ts").append(choice);
        }      
    
        function selectDoc(topic){
            // select the documents after the selection of topic in current round
            var nonzeroDoc = [];
            alpha[topic].forEach(function(doc, index){
                if (doc===alpha[0][0]){
                    nonzeroDoc.push(index);
                }
            });
            return nonzeroDoc;
        }
    
        function updateDoc(topic){
            // updates the documents(currentDoc) available for a given round based on the selected topic
            if (currentDoc.length > 1){
                var updatedDoc =[]; //  updated doc after selection of topic, will be saved to currentDoc.
                nonzeroDoc = selectDoc(topic);
                currentDoc.forEach(function(doc){
                    if (nonzeroDoc.indexOf(doc) != -1){
                        updatedDoc.push(doc);
                    }                                   
                });
                currentDoc = updatedDoc;
            }
        }
 
        function selectRound(){
            // select the next round after the selection of topic in current round
            var t; 
            var rnd;
            for (i= (topicRound[r]+1); i<alpha.length; i++){ // topicRound list contains the number of topics at each round.
                if (alpha[i][currentDoc[0]] != 0){
                    t = i;
                    break;
                }
            }
            for (j = r; j < topicRound.length; j++){
                if (t < topicRound[j]){
                    rnd = j;
                    break;
                }
            }
            return rnd;
        }
        
        $("#ct").on("click", "li", function(event){
            var stTime  = new Date();
            var docidx;
            st = Number($(this).find('#tpid').text())-1;  // Topic id of the topic selected by the user
            dst = Number($(this).find('#dytpid').text());   // Topic words(top words) selected by the user
            stView.push(st); // Store the selected topic and time in a list for a round
            stView.push(stTime.toString());
            updateRound(); // Store the values of the ds of this round and reset the values of the ds.
            addST(st,dst,r); // add an html element to the selected topic area as according to the selection.           
            updateDoc(st); // Updates the current available doc values based on the selection.
            // Now select the round
            if (r==0){
                r = r +1;
            }else{
                // r = selectRound();
                r = r+1;
            }       
            rstat = rstat+1; // update the round count in the status for activation of the submit button.
            checkStatus();
            if (currentDoc.length === 1){
                docidx = getDocId(0);
                addDoc(docidx);
                $('#ct li').remove();
            }else{
                docidx = sampleDoc(currentDoc, st);
                addDoc(currentDoc[docidx]);
                addCT(r);
            }
            addDocStatus();
            event.stopPropagation();
        });
    
        
        $("#ts").on("click", "li", function(event){
            updateRound();
            r = Number($(this).find('.rnb').text()) - 1;
            currentDoc =fetchCurrentDoc(r);
            currentTopic = fetchCurrentTopic(r)
            cstat = cstat + 1;
            removeDoc();
            $(this).fadeOut(10,function(){
                $(this).nextAll().remove();
                $(this).remove();
                addCT(r);
                if (currentDoc.length === cdl){
                    removeDoc();
                }else{
                    docidx = sampleDoc(currentDoc, currentTopic);
                    addDoc(currentDoc[docidx]);     
                }
            });
            event.stopPropagation();
            addDocStatus();
        });
    
        
        $("#ts").on({
            mouseenter:function(event){
                var rtime = new Date();
                vr = Number($(this).find('.rnb').text());
                roundsView.push(vr);
                roundsView.push(rtime.toString());
                $(this).find("div").toggleClass("hide");
                checkStatus();
                event.stopPropagation();
            }, 
            mouseleave:function(){
                $(this).find("div").toggleClass("hide");   
            }
        }, "li" );


        $("#inf_icon").hover(
            function(event){
                $("body").find("*").not("#information *").toggleClass("bckgrnd");
                $("#information").toggleClass("hide");
                event.stopPropagation();
            },
            function(event){
                $("body").find("*").not("#information *").toggleClass("bckgrnd");
                $("#information").toggleClass("hide");
                event.stopPropagation();
            }
        );  
        
        $(".status").on({
            mouseenter:function(event){
                $("body").find("*").not("#statusContent *").toggleClass("bckgrnd");
                addStatus();
                $("#statusContent").toggleClass("hide");
                event.stopPropagation();
            }, 
            mouseleave:function(){
                $("body").find("*").not("#statusContent *").toggleClass("bckgrnd");
                $("#statusContent").toggleClass("hide");
            }
        }, "a");   
    
        $("#display").on('click', function(){
            var selectedIndex = $("#docno").val();
            $("#docno").val("");
            if (currentDoc.indexOf(Number(selectedIndex)-1) != -1){
                docId = String(Number(selectedIndex)-1);
                $("#vd").fadeOut(10,function(){
                    addDoc(docId);
                });
            }else{
                removeDoc();
                $("#vd").append($("<p>Document not found</p>"))
            }
            event.stopPropagation();
        });
        addCT(r);
        addDocStatus();
    });
    
    
    $(".sbmt").on("click", function() {
        $("#expmnt").toggleClass("hide");
        $("footer").toggleClass("hide");
        $("body").find("*").not("#alert *, #smmry *").toggleClass("bckgrnd");
        $(".status").toggleClass("hide");
        $("#alert").toggleClass("hide");
        endTime = new Date();
        event.stopPropagation();
    });
    
    $("#stay").on("click", function() {
        $("#expmnt").toggleClass("hide");
        $("footer").toggleClass("hide");
        $("body").find("*").not("#alert *, #smmry *").toggleClass("bckgrnd");
        $("#alert").toggleClass("hide");
        event.stopPropagation();
    });

    $("#proceed").on("click", function() {
        updateRound();
        totalTime = (endTime.getTime() - startTime.getTime()) / 1000;
        $("#expmnt").remove();
        $("#alert").remove();
        $("footer").toggleClass("hide");
        $("body").find("*").not("#alert *, #smmry *").toggleClass("bckgrnd");
        $("#smmry").removeClass("hide");
        event.stopPropagation();
    });
    
    $.getJSON("/data/wordData.json", function(data){
        var word = data["words"];
        var count;
        function countWords(str){
            var newStr = [];
            str.forEach(function(wd){
                if (word.indexOf(wd) != -1){
                    newStr.push(wd);
                }
            });
            return newStr.length;
        }
        
        function summaryStatus(count){
            // add the HTML element of the count of valid words from the summary provided by the users
            var cntstat = "<strong>Quality Assessment: </strong>"+count+" /50";
            $("#statusCntr").html(cntstat);
        }
        
        function processInput(){
            // clean the summary text provided by the user and activate the submit button if the valid words count reaches a pre determined value.
            var str = $(this).val();
            summaryData = str;
            str = cleanText(str);
            count = countWords(str);
            summaryStatus(count);
            if (count >=50){
                $("#surveySbmt").removeClass("disabled");
            }else{
                $("#surveySbmt").addClass("disabled");
            }
        }
         
        $("textarea").on("keyup", processInput);
        
        $("#surveySbmt").on("click", function(){
            if (Number(count >= 50)){
                addExpData();
                turk.submit(traversePath);
            }else{
                alert("The summary is short of the required minimum length for submission.");
            }
        });
        summaryStatus(0);
    });
});