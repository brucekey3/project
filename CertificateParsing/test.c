// Utilities
#include <stdio.h>
#include <string.h>
#include <time.h>


// OpenSSL headers
#include <openssl/x509v3.h>
#include <openssl/bn.h>
#include <openssl/asn1.h>
#include <openssl/x509.h>
#include <openssl/x509_vfy.h>
#include <openssl/pem.h>
#include <openssl/bio.h>

#define SIG_ALGO_LEN 1000
#define PUBKEY_ALGO_LEN 1000

static time_t ASN1_GetTimeT(ASN1_TIME* time){
    struct tm t;
    const char* str = (const char*) time->data;
    size_t i = 0;

    memset(&t, 0, sizeof(t));

    if (time->type == V_ASN1_UTCTIME) {/* two digit year */
        t.tm_year = (str[i++] - '0') * 10;
        t.tm_year += (str[i++] - '0');
        if (t.tm_year < 70)
            t.tm_year += 100;
    } else if (time->type == V_ASN1_GENERALIZEDTIME) {/* four digit year */
        t.tm_year = (str[i++] - '0') * 1000;
        t.tm_year+= (str[i++] - '0') * 100;
        t.tm_year+= (str[i++] - '0') * 10;
        t.tm_year+= (str[i++] - '0');
        t.tm_year -= 1900;
    }
    t.tm_mon  = (str[i++] - '0') * 10;
    t.tm_mon += (str[i++] - '0') - 1; // -1 since January is 0 not 1.
    t.tm_mday = (str[i++] - '0') * 10;
    t.tm_mday+= (str[i++] - '0');
    t.tm_hour = (str[i++] - '0') * 10;
    t.tm_hour+= (str[i++] - '0');
    t.tm_min  = (str[i++] - '0') * 10;
    t.tm_min += (str[i++] - '0');
    t.tm_sec  = (str[i++] - '0') * 10;
    t.tm_sec += (str[i++] - '0');

    /* Note: we did not adjust the time based on time zone information */
    return mktime(&t);
}

int main(int argc, char** argv)
{
	if (argc != 3)
	{
		printf("argc is %d, expected 3\n", argc);
		return EXIT_FAILURE;
	}
	
	
	OpenSSL_add_all_algorithms();
	const char* path = argv[1];
	FILE *fp = fopen(path, "r");
	if (!fp) {
		fprintf(stderr, "unable to open: %s\n", path);
		return EXIT_FAILURE;
	}
	
	X509 *cert = PEM_read_X509(fp, NULL, NULL, NULL);
	if (!cert) {
		fprintf(stderr, "unable to parse certificate in: %s\n", path);
		fclose(fp);
		return EXIT_FAILURE;
	}
	
	// any additional processing would go here..
	char *subj = X509_NAME_oneline(X509_get_subject_name(cert), NULL, 0);
	char *issuer = X509_NAME_oneline(X509_get_issuer_name(cert), NULL, 0);
	
	
	printf("Subject is: %s \n", subj);
	printf("Issuer is: %s \n", issuer);
	
	
	int pkey_nid = OBJ_obj2nid(cert->cert_info->key->algor->algorithm);

	if (pkey_nid == NID_undef) {
		fprintf(stderr, "unable to find specified signature algorithm name.\n");
		return EXIT_FAILURE;
	}

	char sigalgo_name[SIG_ALGO_LEN+1];
	const char* sslbuf = OBJ_nid2ln(pkey_nid);

	if (strlen(sslbuf) > PUBKEY_ALGO_LEN) {
		fprintf(stderr, "public key algorithm name longer than allocated buffer.\n");
		return EXIT_FAILURE;
	}

	printf("Signature Algorithm: %s \n", sslbuf);
	
	ASN1_TIME *start = X509_get_notBefore(cert);
	ASN1_TIME *end  = X509_get_notAfter(cert);
	
	const char* startTimeString = (const char*) start->data;
	const char* endTimeString   = (const char*) end->data;
	
	time_t startTime = ASN1_GetTimeT(start);
	time_t endTime   = ASN1_GetTimeT(end);
	time_t duration  = endTime - startTime;
	time_t now       = time(0);
	
	time_t sinceIssued = now - startTime;
	time_t willRunOut  = endTime - now;
	
	float durationDays = (duration / (60*60*24));
	float issuedDays   = (sinceIssued / (60*60*24));
	float expiryDays   = (willRunOut / (60*60*24));
	
	printf("Start time: %lu \n", startTime);
	printf("End time: %lu \n", endTime);
	printf("Current: %lu\n", now);

	printf("Issued for %f days\n", durationDays);
	printf("Issued %f days ago\n", issuedDays);
	printf("Expires in %f days\n", expiryDays);
	
	
	fclose(fp);
	
	const char* outputPath = argv[2];
	FILE *resultsFptr = fopen(outputPath, "a");
	if (!resultsFptr) {
		fprintf(stderr, "unable to create results file\n");
		return EXIT_FAILURE;
	}
	
	char *subjC = "";
	char *subjST = "";
	char *subjL = "";
	char *subjO = "";
	char *subjCN = "";

	X509_NAME *subjName = X509_get_subject_name(cert);
	for (int i = 0; i < X509_NAME_entry_count(subjName); i++) {
		X509_NAME_ENTRY *e = X509_NAME_get_entry(subjName, i);
		ASN1_STRING *d = X509_NAME_ENTRY_get_data(e);
		char *value = ASN1_STRING_data(d);
		
		ASN1_OBJECT *fn = X509_NAME_ENTRY_get_object(e);
		char *field = OBJ_nid2sn( OBJ_obj2nid( fn ) ); 
		
		printf("Subject entry %s is: %s \n", field, value);
		
		if (!strcmp(field, "C")) 
		{
			subjC = value;
		}
		else if (!strcmp(field, "ST"))
		{
			subjST = value;
		}
		else if (!strcmp(field, "L"))
		{
			subjL = value;
		}
		else if (!strcmp(field, "O"))
		{
			subjO = value;
		}
		else if (!strcmp(field, "CN"))
		{
			subjCN = value;
		}
	}
	
	char *issC = "";
	char *issST = "";
	char *issL = "";
	char *issO = "";
	char *issCN = "";
	
	X509_NAME *issName = X509_get_issuer_name(cert);
	for (int i = 0; i < X509_NAME_entry_count(issName); i++) {
		X509_NAME_ENTRY *e = X509_NAME_get_entry(issName, i);
		ASN1_STRING *d = X509_NAME_ENTRY_get_data(e);
		char *value = ASN1_STRING_data(d);
		
		ASN1_OBJECT *fn = X509_NAME_ENTRY_get_object(e);
		char *field = OBJ_nid2sn( OBJ_obj2nid( fn ) ); 
		
		printf("Issuer entry %s is: %s \n", field, value);

		if (!strcmp(field, "C"))
		{
			issC = value;
		}
		else if (!strcmp(field, "ST"))
		{
			issST = value;
		}
		else if (!strcmp(field, "L"))
		{
			issL = value;
		}
		else if (!strcmp(field, "O"))
		{
			issO = value;
		}
		else if (!strcmp(field, "CN"))
		{
			issCN = value;
		}
	}
	
	// Subject, Issuer, algorithm, how long issued for, time since issued, time til expires
	fprintf(resultsFptr, "%s/%s/%s/%s/%s/%s/%s/%s/%s/%s/%s/%f/%f/%f\n",
	 issC, issST, issL, issO, issCN, 
	 subjC, subjST, subjL, subjO, subjCN,
	 sslbuf, durationDays, issuedDays, expiryDays);
  

	fclose(resultsFptr);
	
	OPENSSL_free(subj);
	OPENSSL_free(issuer);
	
	X509_free(cert);
		
	return EXIT_SUCCESS;
}