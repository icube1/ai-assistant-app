import { Alert, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import Voice from '@react-native-voice/voice';
import { Text, View } from "@/components/Themed";
import { FontAwesome5 } from "@expo/vector-icons";
// @ts-ignore
import { useEffect, useRef, useState } from "react";
import { apiCall } from "@/utils/openAI";
// import { Recording } from "expo-av/build/Audio";


export default function TabOneScreen() {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [recording, setRecording] = useState(undefined);
  const [result, setResult] = useState('');
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef(null);

  const handleStopButton = () => {
    setSpeaking(false);
    stopRecording();
  };

  const handleRecordButton = (): void => {
    // throw new Error('Function not implemented.');
    setSpeaking(true);
    startRecording();  
  };

  async function startRecording() {
    await Voice.start('ru-RU')
    .catch(err => console.log(err))
  }

  async function stopRecording() {
    await Voice.stop()
    fetchResponse()
  }

  const speechStartHandler = (e): void => {
    console.log(e);
  }
  const speechEndHandler = (e): void => {
    console.log(e)
  }
  
  const speechResultHandler = (e): void => {
    // console.log(e);
    setResult(e.value[0]);
  }
  
  const speechErrorHandler = (e): void => {
    console.log(e)
  }

  // set listeners
  useEffect(() => {
    Voice.onSpeechStart = speechStartHandler;
    Voice.onSpeechEnd = speechEndHandler;
    Voice.onSpeechError = speechErrorHandler;
    Voice.onSpeechResults = speechResultHandler;

    return () => {
      Voice.destroy()
        .then(Voice.removeAllListeners)
    }
  }, [])

  
  const fetchResponse = async () =>{
    if(result.trim().length>0){
      setLoading(true);
      let newMessages = [...messages];
      newMessages.push({role: 'user', content: result.trim()});
      setMessages([...newMessages]);

      // scroll to the bottom of the view
      updateScrollView();

      // fetching response from chatGPT with our prompt and old messages
      apiCall(result.trim(), newMessages).then(res=>{
        console.log('got api data');
        // setLoading(false);
        if(res.success){
          setMessages([...res.data]);
          setResult('');
          updateScrollView();

          // now play the response to user
          startTextToSpeach(res.data[res.data.length-1]);
          
        }else{
          Alert.alert('Error', res.msg);
        }
        
      })
      .finally(()=>setLoading(false))
    }
  }



  const updateScrollView = ()=>{
    setTimeout(()=>{
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    },200)
  }

  const startTextToSpeach = (message: { content: string | string[]; }) =>{
    if(!message.content.includes('https')){
      setSpeaking(true);
      // playing response with the voice id and voice speed
      // Tts.speak(message.content, {
      //   iosVoiceId: 'com.apple.ttsbundle.Samantha-compact',
      //   rate: 0.5,
      // });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text>{result}</Text>
      <ScrollView ref={scrollViewRef} bounces={false} showsVerticalScrollIndicator={false} style={{flexDirection: 'column'}}>
        {messages.map(message => {
          if(message.content.includes("https")){
            return <Image width={260} height={260} source={{
              uri: message.content,
            }} />
          }
          return <Text>{message.content}</Text>
        })}
      </ScrollView>
      {speaking && (
        <TouchableOpacity
          style={[
            styles.recordButton,
            { borderColor: "tomato", backgroundColor: "tomato" },
          ]}
          onPress={handleStopButton}
        >
          <FontAwesome5 name="stop" size={24} color="white" />
          <Text>Stop</Text>
        </TouchableOpacity>
      )}
      {!speaking && <TouchableOpacity
        style={styles.recordButton}
        onPress={() => handleRecordButton()}
      >
        <FontAwesome5 name="microphone-alt" size={36} color="white" />
        {loading && <Text>Loading</Text>}
      </TouchableOpacity>}
      <TouchableOpacity
        style={[styles.recordButton, { right: 64, width: 52, height: 52 }]}
        onPress={() => {}}
      >
        {/* <FontAwesome5 name="trash" size={18} color="white" /> */}
        <Text>Clear</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 10
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  recordButton: {
    borderRadius: 32,
    borderWidth: 8,
    borderColor: "rgba(100,255,100,0.3)",
    backgroundColor: "rgba(100,255,100,0.5)",
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 30,
  },
});
